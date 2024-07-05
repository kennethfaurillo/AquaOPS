import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(str){
	const strList = str.split(' ')
  return strList.map((val) => val.at(0).toUpperCase() + val.slice(1).toLowerCase()).join(' ')
}