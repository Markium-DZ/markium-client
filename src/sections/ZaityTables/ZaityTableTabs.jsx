import React, { useCallback, useEffect, useState } from 'react';
import { Tab, Tabs } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Label from 'src/components/label';
import { getComparator, useTable } from 'src/components/table';

const ZaityTableTabs = ({
  children,
  data = [],
  items = [],
  filterKey = "status",
  setTableDate,
  dateError,
  defaultFilters = {},
  defaultOrderBy = 'orderNumber',
  filterFunction,
  t = (text) => text,
}) => {
  const table = useTable({ defaultOrderBy });
  const [filters, setFilters] = useState({ ...defaultFilters, [filterKey]: defaultFilters[filterKey] || 'all' });

  const handleFilters = useCallback((name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, [data]);



  const handleFilterStatus = useCallback(
    (event, newValue) => {
      handleFilters(filterKey, newValue);
    },
    [handleFilters, filterKey]
  );

  const dataFiltered = applyFilter({
    inputData: data,
    comparator: getComparator(table.order, table.orderBy),
    filters,
    dateError,
    currentKey: filterKey,
    items
  });

  useEffect(() => {
    setTableDate(dataFiltered)
  }, [filters,data])


  return (
    <>
      <Tabs
        value={filters?.[filterKey]}
        onChange={handleFilterStatus}
        sx={{
          px: 2.5,
          boxShadow: (theme) => `inset 0 -2px 0 0 ${alpha(theme.palette.grey[500], 0.08)}`,
        }}
      >


        {items?.map((tab, index) => {
          const count = tab.count ?? data.filter((item) => tab.match?.(item)).length;

          return (
            <Tab
              key={index}
              value={tab.key}
              iconPosition="end"
              label={tab.label}
              icon={
                <Label
                  variant={tab.key === filters[filterKey] ? 'filled' : 'soft'}
                  color={tab.color || 'default'}
                >
                  {count}
                </Label>
              }
            />
          );
        })}
      </Tabs>

      {children}
    </>
  );
};

export default ZaityTableTabs;

// ———————————————

function applyFilter({ inputData, comparator, filters, currentKey, items }) {
  // Sort data stably
  const stabilizedThis = inputData.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  // Apply dynamic filters
  Object.entries(filters).forEach(([key, value]) => {
    if (!value || value === 'all' || value === 'All') return;
    const matcherTab = items?.find(i => i.key == filters?.[currentKey])
    console.log("matcherTab : ", matcherTab);

    inputData = inputData.filter((item) => {
      const fieldValue = item?.[key];

      // Special case for status key
      if (key == currentKey) {
        // return condition(item);
        return matcherTab?.match(item)
      }

      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(value.toLowerCase());
      }

      if (Array.isArray(fieldValue)) {
        return fieldValue.includes(value);
      }

      return fieldValue == value;
    });
  });

  return inputData;
}
