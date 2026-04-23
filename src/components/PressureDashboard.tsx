import { useEffect, useMemo, useState } from 'react';
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart,
} from 'recharts';
import {
    CalendarIcon,
    Save,
    AlertTriangle,
    CheckCircle2,
    Database,
    Loader2Icon,
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/hooks/useAuth';
import { Datalogger, ReportParameters } from './Types';
import { generateReport, parseLoggerName, pressureReportToBaselinePoints, toBoolean, toFiniteNumber } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { toast } from 'sonner';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SUB_HOUR_STEPS = 6;

type RawPressurePoint = {
    day: string;
    hour: number;
    pressure: number;
};

type ProcessedPressurePoint = {
    day: string;
    hour: number;
    baseline: number;
    warning: number | null;
    critical: number | null;
    isTriggered: boolean;
    triggeredChecks: string[];
    isShutdownHour: boolean;
};

type DaySummary = {
    avgBaseline: number;
    minBaseline: number;
    maxBaseline: number;
    avgWarning: number;
    avgCritical: number;
};

type AlarmThresholdConfig = {
    warnPct?: number;
    critPct?: number;
    leadWeight?: number;
    useMedian?: boolean;
    shutdownHours?: string[];
};

type SavedThresholdRow = {
    BaselineMonth?: unknown;
    DayName?: unknown;
    Hour?: unknown;
    Baseline?: unknown;
    Warning?: unknown;
    Critical?: unknown;
};

type AlarmThresholdSaveRow = {
    LoggerId: string;
    BaselineMonth: string;
    DayName: string;
    Hour: number;
    Baseline: number;
    Warning: number;
    Critical: number;
};

type AlarmThresholdSavePayload = {
    loggerId: string;
    baselineMonth?: string;
    baselineRange?: {
        from: string;
        to: string;
    };
    source: 'baseline-period' | 'existing-config';
    useMedian: boolean;
    warnPct: number;
    critPct: number;
    leadWeight: number;
    shutdownHours: string[];
    thresholds: AlarmThresholdSaveRow[];
};

const formatRatio = (value: number) => `${Math.round(value * 100)}%`;
const formatPressure = (value: number) => `${value.toFixed(2)} psi`;
const formatBaselineMonth = (value: string) => format(new Date(value), 'MMMM yyyy');
const formatHourLabel = (hourValue: number) => {
    const totalMinutes = Math.round((hourValue % 24) * 60);
    const normalizedHour = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const suffix = normalizedHour >= 12 ? 'PM' : 'AM';
    const hour12 = normalizedHour % 12 || 12;
    const minuteText = minutes.toString().padStart(2, '0');

    return `${hour12}:${minuteText} ${suffix}`;
};

type PressureDashboardProps = {
    loggerInfo?: Pick<Datalogger, 'LoggerId' | 'Name'> | null;
    triggerClassName?: string;
};

type LegendEntry = {
    color?: string;
    value?: string | number;
};

const renderLegend = ({ payload }: { payload?: LegendEntry[] }) => (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-2 text-xs text-slate-600">
        {payload?.map((entry, index) => {
            const label = String(entry.value ?? '');
            const isZone = label.toLowerCase().includes('zone');
            const isThreshold = label.toLowerCase().includes('threshold');

            return (
                <div key={`${label}-${index}`} className="flex items-center gap-2">
                    {isZone ? (
                        <span
                            className="h-3 w-4 rounded-sm border border-slate-300/70"
                            style={{
                                backgroundColor: entry.color,
                                opacity: 0.35,
                            }}
                        />
                    ) : isThreshold ? (
                        <span
                            className="h-0.5 w-5 rounded-full"
                            style={{
                                backgroundImage: `repeating-linear-gradient(to right, ${entry.color} 0 2px, transparent 2px 5px)`,
                            }}
                        />
                    ) : (
                        <span
                            className="h-0.5 w-5 rounded-full"
                            style={{
                                backgroundColor: entry.color,
                            }}
                        />
                    )}
                    <span>{label}</span>
                </div>
            );
        })}
    </div>
);

const baselineReportFields: ReportParameters = {
    param: 'pressure',
    averaging: 'hourly',
    totalizerNet: false,
    totalizerPositive: false,
    totalizerNegative: false,
};

const PRESET_OPTIONS = {
    custom: { label: 'Custom', warnPct: null, critPct: null, leadWeight: null },
    standard5025: { label: 'Standard 50 / 25', warnPct: 0.5, critPct: 0.25, leadWeight: 0 },
    standard6633: { label: 'Standard 66 / 33', warnPct: 0.66, critPct: 0.33, leadWeight: 0 },
    lead6633: { label: '66 / 33 with 0.5 lead', warnPct: 0.66, critPct: 0.33, leadWeight: 0.5 },
    lead5025: { label: '50 / 25 with 1.0 lead', warnPct: 0.5, critPct: 0.25, leadWeight: 1 },
} as const;

type PresetKey = keyof typeof PRESET_OPTIONS;
const SHUTDOWN_HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
    value: String(hour),
    label: formatHourLabel(hour).replace(':00 ', ' '),
}));

const normalizeShutdownHours = (value: unknown): string[] | undefined => {
    if (Array.isArray(value)) {
        return value
            .map((entry) => toFiniteNumber(entry))
            .filter((entry): entry is number => entry !== undefined && entry >= 0 && entry <= 23)
            .map((entry) => String(entry));
    }

    if (typeof value === 'string' && value.trim() !== '') {
        return value
            .split(',')
            .map((entry) => toFiniteNumber(entry.trim()))
            .filter((entry): entry is number => entry !== undefined && entry >= 0 && entry <= 23)
            .map((entry) => String(entry));
    }

    return undefined;
};

const normalizeBaselineMonth = (value: unknown): string | undefined => {
    if (typeof value !== 'string' || value.trim() === '') {
        return undefined;
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
        return undefined;
    }

    return format(parsedDate, 'yyyy-MM-01');
};

const parseSavedThresholdRows = (payload: unknown): ProcessedPressurePoint[] | null => {
    if (!Array.isArray(payload)) {
        return null;
    }

    const parsedRows: Array<ProcessedPressurePoint | null> = payload
        .map((entry) => {
            if (!entry || typeof entry !== 'object') {
                return null;
            }

            const row = entry as SavedThresholdRow;
            const day = typeof row.DayName === 'string' && DAYS.includes(row.DayName)
                ? row.DayName
                : null;
            const hour = toFiniteNumber(row.Hour);
            const baseline = toFiniteNumber(row.Baseline);
            const warning = toFiniteNumber(row.Warning);
            const critical = toFiniteNumber(row.Critical);

            if (day === null || hour === undefined || baseline === undefined || warning === undefined || critical === undefined) {
                return null;
            }

            return {
                day,
                hour,
                baseline,
                warning,
                critical,
                isTriggered: false,
                triggeredChecks: [],
                isShutdownHour: false,
            };
        });

    const rows = parsedRows
        .filter((entry): entry is ProcessedPressurePoint => entry !== null)
        .sort((left, right) => {
            const dayDelta = DAYS.indexOf(left.day) - DAYS.indexOf(right.day);
            return dayDelta !== 0 ? dayDelta : left.hour - right.hour;
        });

    return rows.length ? rows : null;
};

const getBaselineMonthFromSavedRows = (payload: unknown): string | undefined => {
    if (!Array.isArray(payload) || !payload.length) {
        return undefined;
    }

    const firstRow = payload[0] as SavedThresholdRow;
    return normalizeBaselineMonth(firstRow?.BaselineMonth);
};

const parseAlarmThresholdConfig = (payload: unknown): AlarmThresholdConfig | null => {
    if (Array.isArray(payload)) {
        return payload.length ? parseAlarmThresholdConfig(payload[0]) : null;
    }

    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const source = payload as Record<string, unknown>;
    const warnPct = toFiniteNumber(
        source.warnPct ?? source.warningPct ?? source.warningRatio ?? source.warn_ratio ?? source.warning_ratio
    );
    const critPct = toFiniteNumber(
        source.critPct ?? source.criticalPct ?? source.criticalRatio ?? source.crit_ratio ?? source.critical_ratio
    );
    const leadWeight = toFiniteNumber(
        source.leadWeight ?? source.lead_ratio ?? source.nextHourLeadWeight ?? source.lead
    );
    const useMedian = toBoolean(
        source.useMedian ?? source.use_median ?? source.baselineMedian ?? source.baseline_median
    );
    const shutdownHours = normalizeShutdownHours(
        source.shutdownHours ?? source.shutdown_hours ?? source.disabledHours ?? source.disabled_hours
    );

    if (
        warnPct === undefined
        && critPct === undefined
        && leadWeight === undefined
        && useMedian === undefined
        && shutdownHours === undefined
    ) {
        return null;
    }

    return { warnPct, critPct, leadWeight, useMedian, shutdownHours };
};

const getPresetFromValues = (warnPct: number, critPct: number, leadWeight: number): PresetKey => {
    const matchingPreset = (Object.entries(PRESET_OPTIONS) as Array<[PresetKey, typeof PRESET_OPTIONS[PresetKey]]>).find(([, config]) => (
        config.warnPct === warnPct
        && config.critPct === critPct
        && config.leadWeight === leadWeight
    ));

    return matchingPreset?.[0] ?? 'custom';
};

const PressureDashboard = ({ loggerInfo, triggerClassName }: PressureDashboardProps) => {
    const [rawData, setRawData] = useState<RawPressurePoint[]>([]);
    const [savedThresholdData, setSavedThresholdData] = useState<ProcessedPressurePoint[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loadingDates, setLoadingDates] = useState(false);
    const [loadingBaseline, setLoadingBaseline] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [useMedian, setUseMedian] = useState(true);
    const [baselineRange, setBaselineRange] = useState<DateRange | undefined>();
    const [baselineMonth, setBaselineMonth] = useState<string | undefined>();
    const [allowedDates, setAllowedDates] = useState<string[]>([]);
    const [selectedPreset, setSelectedPreset] = useState<PresetKey>('standard6633');
    const [shutdownHours, setShutdownHours] = useState<string[]>([]);

    const { user } = useAuth();
    const [warnPct, setWarnPct] = useState(0.66);
    const [critPct, setCritPct] = useState(0.33);
    const [leadWeight, setLeadWeight] = useState(0.0);
    const isLeadMode = leadWeight > 0;
    const isPumpingStation = /PS\d+/i.test(loggerInfo?.Name ?? '');
    const hasBaselineData = rawData.length > 0;
    const hasSavedThresholdData = savedThresholdData.length > 0;

    useEffect(() => {
        if (!dialogOpen || !loggerInfo?.LoggerId) {
            return;
        }

        let isActive = true;

        const fetchAllowedDates = async () => {
            setLoadingDates(true);
            try {
                const response = await axios.get<string[]>(`${import.meta.env.VITE_API}/api/pressure_log_dates/${loggerInfo.LoggerId}`, { withCredentials: true });
                if (!isActive) {
                    return;
                }
                setAllowedDates(response.data ?? []);
            } catch (error) {
                if (isActive) {
                    toast.error('Unable to load baseline dates');
                }
            } finally {
                if (isActive) {
                    setLoadingDates(false);
                }
            }
        };

        const fetchExistingConfig = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API}/api/alarm_threshold/${loggerInfo.LoggerId}`,
                    { withCredentials: true }
                );

                if (!isActive) {
                    return;
                }

                const savedRows = parseSavedThresholdRows(response.data);
                if (savedRows) {
                    setSavedThresholdData(savedRows);
                    setBaselineMonth(getBaselineMonthFromSavedRows(response.data));
                    setSelectedDay(savedRows[0]?.day ?? 'Monday');
                    return;
                }

                const config = parseAlarmThresholdConfig(response.data);
                if (!config) {
                    return;
                }

                const nextWarnPct = config.warnPct ?? 0.66;
                const nextCritPct = config.critPct ?? 0.33;
                const nextLeadWeight = config.leadWeight ?? 0;

                setWarnPct(nextWarnPct);
                setCritPct(nextCritPct);
                setLeadWeight(nextLeadWeight);
                setSelectedPreset(getPresetFromValues(nextWarnPct, nextCritPct, nextLeadWeight));

                if (config.useMedian !== undefined) {
                    setUseMedian(config.useMedian);
                }

                if (config.shutdownHours) {
                    setShutdownHours(config.shutdownHours);
                }
            } catch (error) {
                if (!isActive || !axios.isAxiosError(error)) {
                    return;
                }

                if (error.response?.status !== 404) {
                    toast.error('Unable to load saved alarm config');
                }
            }
        };

        fetchAllowedDates();
        fetchExistingConfig();

        return () => {
            isActive = false;
        };
    }, [dialogOpen, loggerInfo?.LoggerId]);

    // 2. Processing Logic (Equivalent to get_stats in Python)
    const processedData = useMemo<ProcessedPressurePoint[]>(() => {
        if (rawData.length === 0) return [];

        // Grouping logic
        const stats = DAYS.map(day => {
            const dayHours = Array.from({ length: 24 }, (_, hour) => {
                const samples = rawData.filter(d => d.day === day && d.hour === hour);
                const values = samples.map(s => s.pressure).sort((a, b) => a - b);

                let baseline = 0;
                if (values.length > 0) {
                    baseline = useMedian
                        ? values[Math.floor(values.length / 2)]
                        : values.reduce((a, b) => a + b, 0) / values.length;
                }
                return { hour, baseline: parseFloat(baseline.toFixed(2)) };
            });

            // Keep baseline/threshold values hourly, but run 6 ten-minute trigger checks within each hour.
            return dayHours.map((curr, idx) => {
                const nextHour = dayHours[(idx + 1) % 24];
                const isShutdownHour = isPumpingStation && shutdownHours.includes(String(curr.hour));

                if (isShutdownHour) {
                    return {
                        day,
                        hour: curr.hour,
                        baseline: parseFloat(curr.baseline.toFixed(2)),
                        warning: null,
                        critical: null,
                        isTriggered: false,
                        triggeredChecks: [],
                        isShutdownHour: true,
                    };
                }

                const effectiveP = isLeadMode
                    ? (curr.baseline * (1 - leadWeight)) + (nextHour.baseline * leadWeight)
                    : curr.baseline;
                const warning = Math.floor((effectiveP * warnPct) * 4) / 4;
                const critical = Math.floor((effectiveP * critPct) * 4) / 4;
                const triggeredChecks = Array.from({ length: SUB_HOUR_STEPS }, (_, subHourIndex) => {
                    const interpolation = subHourIndex / SUB_HOUR_STEPS;
                    const interpolatedBaseline = curr.baseline + (nextHour.baseline - curr.baseline) * interpolation;

                    return interpolatedBaseline <= warning ? formatHourLabel(curr.hour + interpolation) : null;
                }).filter((value): value is string => value !== null);

                return {
                    day,
                    hour: curr.hour,
                    baseline: parseFloat(curr.baseline.toFixed(2)),
                    warning,
                    critical,
                    isTriggered: triggeredChecks.length > 0,
                    triggeredChecks,
                    isShutdownHour: false,
                };
            });
        }).flat();

        return stats;
    }, [rawData, useMedian, warnPct, critPct, leadWeight, isLeadMode, isPumpingStation, shutdownHours]);

    const chartData = rawData.length ? processedData : savedThresholdData;
    const hasChartData = chartData.length > 0;
    const isShowingSavedConfig = !hasBaselineData && hasSavedThresholdData;
    const currentDayData = chartData.filter(d => d.day === selectedDay);
    const triggeredHours = currentDayData
        .filter(d => d.isTriggered)
        .map(d => formatHourLabel(d.hour).replace(':00 ', ' '));
    const hasNegativeBaseline = chartData.some(point => point.baseline < 0);

    const daySummary = useMemo<DaySummary>(() => {
        if (!currentDayData.length) {
            return {
                avgBaseline: 0,
                minBaseline: 0,
                maxBaseline: 0,
                avgWarning: 0,
                avgCritical: 0,
            };
        }

        const totals = currentDayData.reduce(
            (summary, point) => ({
                avgBaseline: summary.avgBaseline + point.baseline,
                minBaseline: Math.min(summary.minBaseline, point.baseline),
                maxBaseline: Math.max(summary.maxBaseline, point.baseline),
                avgWarning: summary.avgWarning + (point.warning ?? 0),
                avgCritical: summary.avgCritical + (point.critical ?? 0),
                activeThresholdHours: summary.activeThresholdHours + (point.warning === null ? 0 : 1),
            }),
            {
                avgBaseline: 0,
                minBaseline: Number.POSITIVE_INFINITY,
                maxBaseline: Number.NEGATIVE_INFINITY,
                avgWarning: 0,
                avgCritical: 0,
                activeThresholdHours: 0,
            }
        );

        const thresholdHourCount = totals.activeThresholdHours || 1;

        return {
            avgBaseline: totals.avgBaseline / currentDayData.length,
            minBaseline: totals.minBaseline,
            maxBaseline: totals.maxBaseline,
            avgWarning: totals.avgWarning / thresholdHourCount,
            avgCritical: totals.avgCritical / thresholdHourCount,
        };
    }, [currentDayData]);

    const applyPreset = (w: number, c: number, l: number) => {
        setWarnPct(w);
        setCritPct(c);
        setLeadWeight(l);
    };

    const handleShutdownHourToggle = (hour: string) => {
        setShutdownHours((currentHours) => (
            currentHours.includes(hour)
                ? currentHours.filter((value) => value !== hour)
                : [...currentHours, hour]
        ));
    };

    const handlePresetChange = (preset: PresetKey) => {
        setSelectedPreset(preset);
        const config = PRESET_OPTIONS[preset];
        if (config.warnPct === null || config.critPct === null || config.leadWeight === null) {
            return;
        }
        applyPreset(config.warnPct, config.critPct, config.leadWeight);
    };

    const handleDialogOpenChange = (open: boolean) => {
        setDialogOpen(open);

        if (!open) {
            setRawData([]);
            setSavedThresholdData([]);
            setAllowedDates([]);
            setBaselineRange(undefined);
            setBaselineMonth(undefined);
            setLoadingBaseline(false);
            setLoadingDates(false);
            setSelectedDay('Monday');
            setUseMedian(true);
            setSelectedPreset('standard6633');
            setShutdownHours([]);
            applyPreset(0.66, 0.33, 0);
        }
    };

    const handleLoadBaseline = async () => {
        if (!loggerInfo?.LoggerId) {
            toast.error('No logger selected');
            return;
        }
        if (!baselineRange?.from || !baselineRange?.to) {
            toast.error('Choose a baseline period');
            return;
        }
        if (!user) {
            toast.error('You need to be signed in to load baseline data');
            return;
        }

        setLoadingBaseline(true);
        try {
            const reportRows = await generateReport(
                { LoggerId: loggerInfo.LoggerId } as Datalogger,
                baselineReportFields,
                baselineRange,
                user
            );
            const baselinePoints = pressureReportToBaselinePoints((reportRows ?? []) as Array<{ LogTime: string; CurrentPressure?: number; AveragePressure?: number }>);

            if (!baselinePoints.length) {
                throw new Error('No pressure records were returned for the selected baseline period.');
            }

            setSavedThresholdData([]);
            setBaselineMonth(normalizeBaselineMonth((reportRows?.[0] as { LogTime?: string } | undefined)?.LogTime));
            setRawData(baselinePoints);
            setSelectedDay(baselinePoints[0]?.day ?? 'Monday');
            toast.success('Baseline loaded', { description: 'Pressure logs are ready for threshold preview.' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to load baseline data';
            toast.error(message);
            setRawData([]);
        } finally {
            setLoadingBaseline(false);
        }
    };

    const handleSaveAlarmConfiguration = async () => {
        if (!loggerInfo?.LoggerId) {
            toast.error('No logger selected');
            return;
        }

        if (!hasChartData) {
            toast.error('Nothing to save yet');
            return;
        }

        const thresholds = chartData.reduce<AlarmThresholdSaveRow[]>((rows, point) => {
            if (point.warning === null || point.critical === null) {
                return rows;
            }

            const nextBaselineMonth = baselineMonth ?? (baselineRange?.from ? format(baselineRange.from, 'yyyy-MM-01') : undefined);
            if (!nextBaselineMonth) {
                return rows;
            }

            rows.push({
                LoggerId: loggerInfo.LoggerId,
                BaselineMonth: nextBaselineMonth,
                DayName: point.day,
                Hour: point.hour,
                Baseline: Number(point.baseline.toFixed(2)),
                Warning: Number(point.warning.toFixed(2)),
                Critical: Number(point.critical.toFixed(2)),
            });

            return rows;
        }, []);

        if (!thresholds.length) {
            toast.error('No threshold rows are available to save');
            return;
        }

        const payload: AlarmThresholdSavePayload = {
            loggerId: loggerInfo.LoggerId,
            baselineMonth,
            source: hasBaselineData ? 'baseline-period' : 'existing-config',
            useMedian,
            warnPct,
            critPct,
            leadWeight,
            shutdownHours,
            thresholds,
        };

        if (baselineRange?.from && baselineRange?.to) {
            payload.baselineRange = {
                from: format(baselineRange.from, 'yyyy-MM-dd'),
                to: format(baselineRange.to, 'yyyy-MM-dd'),
            };
        }

        setSavingConfig(true);

        try {
            await axios.post(`${import.meta.env.VITE_API}/api/alarm_threshold/`, payload, { withCredentials: true });

            setSavedThresholdData(thresholds.map((row) => ({
                day: row.DayName,
                hour: row.Hour,
                baseline: row.Baseline,
                warning: row.Warning,
                critical: row.Critical,
                isTriggered: false,
                triggeredChecks: [],
                isShutdownHour: false,
            })));

            toast.success('Alarm configuration saved', {
                    description: 'Your alarm thresholds have been saved and are now displayed in the chart.'
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save alarm configuration';
            toast.error(message);
        } finally {
            setSavingConfig(false);
        }
    };

    return (
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="default"
                    size="sm"
                    className={`h-10 border-piwad-blue-200 bg-piwad-lightblue-500 text-white hover:bg-piwad-lightblue-300 ${triggerClassName ?? ''}`.trim()}
                    disabled={!loggerInfo?.LoggerId}
                >
                    <Database className="mr-2 h-4 w-4" /> Set Alarm Config
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-piwad-blue-500">Pressure Alarm Threshold Configuration</DialogTitle>
                    <DialogDescription>
                        {loggerInfo?.Name ? (
                            <>
                                For <span className="font-medium text-foreground">{parseLoggerName(loggerInfo.Name)}</span>
                                {loggerInfo.LoggerId ? <> ({loggerInfo.LoggerId})</> : null}. Preview warning and critical thresholds from the selected day&apos;s hourly baseline before applying alarm limits.
                                {baselineMonth ? <> Baseline month: <span className="font-medium text-foreground">{formatBaselineMonth(baselineMonth)}</span>.</> : null}
                            </>
                        ) : (
                            <>Preview warning and critical thresholds from the selected day&apos;s hourly baseline before applying alarm limits.{baselineMonth ? <> Baseline month: <span className="font-medium text-foreground">{formatBaselineMonth(baselineMonth)}</span>.</> : null}</>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-12 gap-4 mt-2">
                    <div className="col-span-12 lg:col-span-4 space-y-4">
                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-lg">Baseline Period</CardTitle>
                                <CardDescription>
                                    Select the pressure log period to use as the threshold baseline
                                </CardDescription>
                                <Separator />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {isShowingSavedConfig ? (
                                    <div className="rounded-md border border-piwad-blue-200 bg-piwad-blue-50 p-3 text-xs text-piwad-blue-700/70">
                                        Existing alarm threshold data was found for this logger and is currently displayed in the chart. Load a baseline period to update alarm thresholds.
                                    </div>
                                ) : null}
                                {baselineMonth ? (
                                    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                        Baseline month: <span className="font-medium text-slate-900">{formatBaselineMonth(baselineMonth)}</span>
                                    </div>
                                ) : null}
                                <Popover modal>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {baselineRange?.from ? (
                                                baselineRange.to ? (
                                                    baselineRange.from.toString() === baselineRange.to.toString() ? (
                                                        format(baselineRange.from, 'LLL dd, y')
                                                    ) : (
                                                        `${format(baselineRange.from, 'LLL dd, y')} - ${format(baselineRange.to, 'LLL dd, y')}`
                                                    )
                                                ) : format(baselineRange.from, 'LLL dd, y')
                                            ) : (
                                                <span>Pick a baseline range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        {allowedDates.length ? (
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={baselineRange?.from}
                                                selected={baselineRange}
                                                onSelect={(range) => setBaselineRange(range)}
                                                numberOfMonths={1}
                                                disabled={(calDate) => !allowedDates.includes(calDate.toDateString())}
                                            />
                                        ) : loadingDates ? (
                                            <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                                                <Loader2Icon className="h-4 w-4 animate-spin" /> Loading available dates...
                                            </div>
                                        ) : (
                                            <div className="p-4 text-sm text-muted-foreground">No pressure dates available.</div>
                                        )}
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    className="w-full bg-piwad-lightyellow-500 text-black hover:bg-piwad-lightyellow-500/90"
                                    disabled={!baselineRange?.from || !baselineRange?.to || loadingBaseline}
                                    onClick={handleLoadBaseline}
                                >
                                    {loadingBaseline ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Load Baseline Data
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-4">
                                <CardTitle className="text-lg">Threshold Parameters</CardTitle>
                                <CardDescription>Set the ratios used to derive alarm thresholds from the chosen pressure baseline.</CardDescription>
                                <Separator />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {!hasBaselineData && !isShowingSavedConfig ? (
                                    <div className="rounded-md border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">
                                        Load baseline data first to enable threshold controls.
                                    </div>
                                ) : null}
                                {isShowingSavedConfig ? (
                                    <div className="rounded-md border border-dashed bg-slate-50 p-3 text-sm text-muted-foreground">
                                        Thresholds shown below were loaded from the existing saved config. Load a baseline period if you want to recalculate and adjust them here.
                                    </div>
                                ) : null}
                                <div className='flex justify-between'>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-slate-700">Baseline averaging</div>
                                        <Select disabled={!hasBaselineData} value={useMedian ? 'median' : 'mean'} onValueChange={(value) => setUseMedian(value === 'median')}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select baseline averaging" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="median">Median</SelectItem>
                                                <SelectItem value="mean">Mean</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-slate-700">Quick Presets</div>
                                        <Select disabled={!hasBaselineData} value={selectedPreset} onValueChange={(value) => handlePresetChange(value as PresetKey)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select threshold preset" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="standard5025">Standard 50 / 25</SelectItem>
                                                <SelectItem value="standard6633">Standard 66 / 33</SelectItem>
                                                <SelectItem value="lead6633">66 / 33 with 0.5 lead</SelectItem>
                                                <SelectItem value="lead5025">50 / 25 with 1.0 lead</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                {isPumpingStation ? (
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-slate-700">Shutdown hours</div>
                                        <p className="text-xs text-muted-foreground">Alarms are disabled for selected hours.</p>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-between"
                                                    disabled={!hasBaselineData}
                                                >
                                                    <span>
                                                        {shutdownHours.length
                                                            ? `${shutdownHours.length} hour${shutdownHours.length === 1 ? '' : 's'} selected`
                                                            : 'Select shutdown hours'}
                                                    </span>
                                                    <Badge variant="secondary">{shutdownHours.length}</Badge>
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent align="start" className="w-80 space-y-3">
                                                <div className="text-sm font-medium text-slate-700">Choose hours to skip</div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {SHUTDOWN_HOUR_OPTIONS.map((option) => {
                                                        const isSelected = shutdownHours.includes(option.value);

                                                        return (
                                                            <Button
                                                                key={option.value}
                                                                type="button"
                                                                variant={isSelected ? 'default' : 'outline'}
                                                                size="sm"
                                                                className="justify-center"
                                                                onClick={() => handleShutdownHourToggle(option.value)}
                                                            >
                                                                {option.label}
                                                            </Button>
                                                        );
                                                    })}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                ) : null}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">Warning threshold ratio</span>
                                        <span className="font-medium">{formatRatio(warnPct)}</span>
                                    </div>
                                    <Slider disabled={!hasBaselineData} value={[warnPct]} min={0.1} max={0.9} step={0.01} onValueChange={([value]) => setWarnPct(value)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">Critical threshold ratio</span>
                                        <span className="font-medium">{formatRatio(critPct)}</span>
                                    </div>
                                    <Slider disabled={!hasBaselineData} value={[critPct]} min={0.05} max={0.5} step={0.01} onValueChange={([value]) => setCritPct(value)} />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">Next-hour lead weight</span>
                                        <span className="font-medium">{isLeadMode ? leadWeight.toFixed(2) : '0.00'}</span>
                                    </div>
                                    <Slider disabled={!hasBaselineData} value={[leadWeight]} min={0} max={1} step={0.05} onValueChange={([value]) => setLeadWeight(value)} />
                                    <p className="text-xs text-muted-foreground">Set this to 0 for standard thresholds, or above 0 to blend in the next hour.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="col-span-12 lg:col-span-8">
                        <Card>
                            <CardHeader className="py-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Pressure Threshold Preview</CardTitle>
                                        <CardDescription>
                                            {isShowingSavedConfig
                                                ? `${selectedDay} hourly baseline and thresholds loaded from the existing saved alarm config.`
                                                : `${selectedDay} hourly baseline, with warning and critical thresholds derived from the current settings.`}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary">{isShowingSavedConfig ? 'Saved config' : 'Baseline'}</Badge>
                                        <Badge variant="outline">{isPumpingStation ? 'Pump station' : 'Distribution endpoint'}</Badge>
                                        {isShowingSavedConfig ? (
                                            <Badge className="bg-piwad-blue-50 text-piwad-blue-500 hover:bg-piwad-blue-50">
                                                Loaded from existing config
                                            </Badge>
                                        ) : null}
                                        <Badge variant="outline">{useMedian ? 'Median' : 'Mean'} method</Badge>
                                        <Badge className="bg-piwad-blue-50 text-piwad-blue-500 hover:bg-piwad-blue-50">
                                            Lead W: {leadWeight.toFixed(2)}
                                        </Badge>
                                        {isPumpingStation && shutdownHours.length > 0 ? (
                                            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                                                Shutdown hours: {shutdownHours.length}
                                            </Badge>
                                        ) : null}
                                        {triggeredHours.length > 0 ? (
                                            <Badge variant="destructive" className="animate-pulse">
                                                <AlertTriangle className="mr-1 h-3 w-3" /> Triggered hours: {triggeredHours.join(', ')}
                                            </Badge>
                                        ) : (
                                            <Badge className="bg-green-500 text-white hover:bg-green-600">
                                                <CheckCircle2 className="mr-1 h-3 w-3" /> Threshold preview ready
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                {hasNegativeBaseline && !useMedian ? (
                                    <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                        <div>
                                            Negative baseline values were detected. This can indicate missing or incomplete baseline data. If the pattern looks unstable,
                                            <button
                                                type="button"
                                                className="ml-1 font-semibold underline underline-offset-2 hover:text-amber-900"
                                                onClick={() => setUseMedian(true)}
                                            >
                                                switch to median averaging
                                            </button>
                                            .
                                        </div>
                                    </div>
                                ) : null}
                                <Separator />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {hasChartData && !loadingBaseline ? <div className="flex flex-wrap gap-1">
                                    {DAYS.map(d => (
                                        <Button
                                            key={d}
                                            variant={selectedDay === d ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setSelectedDay(d)}
                                        >
                                            {d.substring(0, 3)}
                                        </Button>
                                    ))}
                                </div> : null}

                                {hasChartData && !loadingBaseline ? <div className="overflow-hidden rounded-lg border bg-white">
                                    <div className="grid grid-cols-2 divide-x divide-y bg-slate-50 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
                                        <div className="bg-piwad-blue-50 px-3 py-2">
                                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Avg Baseline</div>
                                            <div className="mt-1 text-sm font-bold text-slate-900">{formatPressure(daySummary.avgBaseline)}</div>
                                        </div>
                                        <div className="bg-piwad-blue-50 px-3 py-2">
                                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Lowest Baseline</div>
                                            <div className="mt-1 text-sm font-bold text-slate-900">{formatPressure(daySummary.minBaseline)}</div>
                                        </div>
                                        <div className="bg-piwad-blue-50 px-3 py-2">
                                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Highest Baseline</div>
                                            <div className="mt-1 text-sm font-bold text-slate-900">{formatPressure(daySummary.maxBaseline)}</div>
                                        </div>
                                        <div className="bg-orange-50 px-3 py-2">
                                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Avg Warn Level</div>
                                            <div className="mt-1 text-sm font-bold text-slate-900">{formatPressure(daySummary.avgWarning)}</div>
                                        </div>
                                        <div className="bg-red-50 px-3 py-2">
                                            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">Avg Critical Level</div>
                                            <div className="mt-1 text-sm font-bold text-slate-900">{formatPressure(daySummary.avgCritical)}</div>
                                        </div>
                                    </div>
                                </div> : null}

                                {loadingBaseline ? (
                                    <div className="flex min-h-[400px] items-center justify-center rounded-lg border bg-slate-50 p-6 text-center text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Loader2Icon className="h-5 w-5 animate-spin" /> Loading pressure baseline preview...
                                        </div>
                                    </div>
                                ) : hasChartData ? (
                                    <div className="h-[400px] w-full rounded-lg border bg-slate-50 p-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={currentDayData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="hour" tickFormatter={(value) => formatHourLabel(Number(value)).replace(':00 ', ' ')} label={{ value: 'Hour of day', position: 'insideBottom', offset: -5 }} />
                                                <YAxis label={{ value: 'Pressure baseline (psi)', angle: -90, position: 'insideLeft' }} />
                                                <Tooltip labelFormatter={(value) => formatHourLabel(Number(value))} />
                                                <Legend verticalAlign="top" content={renderLegend} />
                                                <Area
                                                    type="stepAfter"
                                                    dataKey="warning"
                                                    tooltipType='none'
                                                    connectNulls={false}
                                                    stroke="none"
                                                    fill="#fbbf24"
                                                    fillOpacity={0.2}
                                                    name="Warning zone"
                                                />
                                                <Area
                                                    type="stepAfter"
                                                    dataKey="critical"
                                                    tooltipType='none'
                                                    connectNulls={false}
                                                    stroke="none"
                                                    fill="#ef4444"
                                                    fillOpacity={0.1}
                                                    name="Critical zone"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="baseline"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    dot={{ r: 3 }}
                                                    name="Baseline"
                                                />
                                                <Line
                                                    type="stepAfter"
                                                    dataKey="warning"
                                                    stroke="#f97316"
                                                    strokeWidth={2}
                                                    strokeDasharray="2 4"
                                                    connectNulls={false}
                                                    dot={false}
                                                    legendType="none"
                                                    name="Warning threshold"
                                                />
                                                <Line
                                                    type="stepAfter"
                                                    dataKey="critical"
                                                    stroke="#dc2626"
                                                    strokeWidth={2}
                                                    strokeDasharray="2 4"
                                                    connectNulls={false}
                                                    dot={false}
                                                    legendType="none"
                                                    name="Critical threshold"
                                                />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed bg-slate-50 p-6 text-center text-sm text-muted-foreground">
                                        Choose a baseline period and load the pressure data to preview alarm thresholds.
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <Button className="bg-green-600 hover:bg-green-700" disabled={!hasChartData || loadingBaseline || savingConfig} onClick={handleSaveAlarmConfiguration}>
                                        {savingConfig ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save Alarm Configuration
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Helper to generate mock data for the example
export function generateMockData() {
    const data: RawPressurePoint[] = [];
    DAYS.forEach(day => {
        for (let hour = 0; hour < 24; hour++) {
            for (let i = 0; i < 5; i++) { // 5 samples per hour
                data.push({
                    day,
                    hour,
                    pressure: 10 + Math.random() * 20 + (hour > 8 && hour < 18 ? 15 : 0)
                });
            }
        }
    });
    return data;
}

export default PressureDashboard;