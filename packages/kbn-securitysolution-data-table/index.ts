/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

export { DataTableComponent } from './components/data_table';

// External state management
export { dataTableActions, dataTableSelectors } from './store/data_table';
export { getTableByIdSelector } from './store/data_table/selectors';
export { dataTableReducer } from './store/data_table/reducer';
export {
  tableDefaults,
  defaultColumnHeaderType,
  defaultHeaders,
} from './store/data_table/defaults';
export type { TableState, DataTableState, TableById } from './store/data_table/types';

export type { SortDirectionTable, SortColumnTable } from './common/types';
export { Direction, tableEntity, FILTER_OPEN, TimelineTabs } from './common/types';
export type { TableIdLiteral, ViewSelection } from './common/types';
export { TableId } from './common/types';

export type { DataTableModel } from './store/data_table/model';
export type { SubsetDataTableModel } from './store/data_table/model';

// Reusable datatable helpers
export * from './components/data_table/helpers';
export * from './components/data_table/column_headers/helpers';
export { getPageRowIndex } from './components/data_table/pagination';

export { TableEntityType } from './common/types';
