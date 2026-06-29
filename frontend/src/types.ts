export interface EntryRecord {
  index: number;
  exercise: string;
  entry_date: string;
  value: string;
  notes: string;
  logged_at: string;
  numeric_value: number;
}

export interface HistoryRow {
  entry_index: number;
  entry_date: string;
  name: string;
  value: string;
  notes: string;
}

export interface Bootstrap {
  entries: EntryRecord[];
  history_rows: HistoryRow[];
  dropdown_names: string[];
  dropdown_values: string[];
  dropdown_notes: string[];
  hidden_values: string[];
  hidden_notes: string[];
  chart_names: string[];
  active_profile: string;
  dropdown_profiles: string[];
}

export interface ChartPointDetail {
  date: string;
  value: number;
  valueDisplay: string;
  entryIndex: number;
  notes: string;
}

export interface ChartPoint extends ChartPointDetail {}
