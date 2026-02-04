import React, { useCallback, useEffect, useState } from 'react';
import OrderTableToolbar from './zaity-table-toolbar';
import OrderTableFiltersResult from './zaity-table-filters-result';
import { getComparator, useTable } from 'src/components/table';

const ZaityTableFilters = ({ data = [], tableData, items, children, searchText, defaultFilters, dateError, setTableDate }) => {
  const table = useTable({ defaultOrderBy: 'orderNumber' });
  const [filters, setFilters] = useState(defaultFilters);

  // ✅ Update only the specific filter field
  const handleFilters = useCallback(
    (name, value) => {
      setFilters(prev => ({ ...prev, [name]: value }));
    },
    []
  );

  // const handleResetFilters = useCallback(() => {
  //   setFilters(tableData);
  // }, [tableData]);


  const handleResetFilters = () => {
    setFilters(tableData);
    setFilters(defaultFilters)
  }

  const dataFiltered = applyFilter({
    inputData: data,
    comparator: getComparator(table.order, table.orderBy),
    filters,
    items,
    tableData
  });

  useEffect(() => {
    setTableDate(dataFiltered);
  }, [filters]);

  // ✅ Reset only if any filter value differs from its default
  const canReset = Object.keys(defaultFilters).some(
    key => filters[key] !== defaultFilters[key]
  );

  return (
    <>
      <OrderTableToolbar searchText={searchText} filters={filters} onFilters={handleFilters} dateError={dateError} />
      {/* {canReset && (
        <OrderTableFiltersResult
          filters={filters}
          // setTableDate={setTableDate}
          // tableData={tableData}
          onFilters={handleFilters}
          onResetFilters={handleResetFilters}
          results={dataFiltered?.length}
          sx={{ p: 2.5, pt: 0 }}
        />
      )} */}
      {children}
    </>
  );
};

export default ZaityTableFilters;





function applyFilter({ inputData, comparator, filters, items, tableData }) {
  const stabilizedThis = inputData.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredData = stabilizedThis.map(el => el[0]);

  Object.entries(filters).forEach(([key, value]) => {
    if (value === 'all' || value === 'All') return;
    if (!value) {
      filteredData = tableData
    } else {


      const matcherTab = items?.find(i => i.key === key);
      if (!matcherTab?.match) return;
      filteredData = tableData.filter(item => matcherTab.match(item, value));
    }
  });

  return filteredData;
}
