import {
  parseBacko,
  BackoResult,
} from "@/lib/backo/parser";

export type { BackoResult };

export const BackoParser = {
  parse: parseBacko,
};