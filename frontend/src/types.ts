export interface RowInput {
  label: string;
  value: string;
}

export interface EntryRecord {
  index: number;
  exercise: string;
  workout_date: string;
  set_values: string[];
  set_labels: string[];
  notes: string;
  logged_at: string;
  volume: number;
  set_count: number;
}

export interface HistoryRow {
  entry_index: number;
  workout_date: string;
  name: string;
  labels: string[];
  values: string[];
  notes: string;
  total: number;
  total_display: string;
}

export interface Bootstrap {
  entries: EntryRecord[];
  history_rows: HistoryRow[];
  dropdown_names: string[];
  dropdown_set_labels: string[];
  dropdown_values: string[];
  chart_names: string[];
}

export interface ChartPoint {
  date: string;
  total: number;
}
