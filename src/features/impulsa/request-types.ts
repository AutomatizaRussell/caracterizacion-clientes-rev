export type CompanyOption = {
  id: string;
  name: string;
  shortName: string;
  contactEmail?: string | null;
  defaultResponsible?: Responsible | null;
};

export type Responsible = {
  name: string;
  role: string;
  firm: string;
};

export type RequestItemMode = "base" | "advanced";

export type RequestItemType = "text" | "table";

export type RequestItem = {
  id: string;
  text: string;
  mode: RequestItemMode;
  selected: boolean;
  children: string[];
  type: RequestItemType;
  table: unknown | null;
};

export type RequestCategory = {
  id: string;
  title: string;
  items: RequestItem[];
};

export type RequestTemplate = {
  id: string;
  name: string;
  prefix: string;
  templateFile: string;
  defaultCutoffDate: string;
  subject: string;
  introParagraphs: string[];
  closingParagraphs: string[];
  categories: RequestCategory[];
};

export type RawRequestItem = {
  id: string;
  text: string;
  selected?: boolean;
  children?: string[];
  type?: RequestItemType;
  table?: unknown | null;
};

export type RawRequestCategory = {
  id: string;
  title: string;
  items: RawRequestItem[];
};

export type RawRequestTemplate = {
  id: string;
  name: string;
  prefix: string;
  templateFile: string;
  defaultCutoffDate: string;
  subject: string;
  introParagraphs: string[];
  closingParagraphs: string[];
  categories: RawRequestCategory[];
};

export type DocumentBlock =
  | {
      id: string;
      type: "paragraph";
      text: string;
      weight: number;
    }
  | {
      id: string;
      type: "category-title";
      text: string;
      weight: number;
    }
  | {
      id: string;
      type: "item";
      text: string;
      weight: number;
      children: string[];
    };