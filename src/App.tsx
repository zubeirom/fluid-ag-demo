import { useEffect, useMemo, useRef, useState } from 'react';
import { data } from './data';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowNode } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './App.css';
import TinyliciousClient from '@fluidframework/tinylicious-client';
import { ContainerSchema, FluidContainer, SharedMap } from 'fluid-framework';

interface IOlympicData {
  athlete: string;
  age: number;
  country: string;
  year: number;
  date: string;
  sport: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

const client: TinyliciousClient = new TinyliciousClient();
const containerSchema: ContainerSchema = {
  initialObjects: { myMap: SharedMap }
};
const gridData = 'gridData';

function App() {
  const gridRef = useRef<AgGridReact>(null);
  const containerStyle = useMemo(() => ({ width: '100%', height: '850px' }), []);
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const [rowData, setRowData] = useState<IOlympicData[]>(data);
  const [fluidMap, setFluidMap] = useState<SharedMap>();
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    { field: 'athlete' },
    { field: 'age', maxWidth: 100 },
    { field: 'country' },
    { field: 'year', maxWidth: 100 },
    {
      field: 'date'
    },
    { field: 'sport' },
    { field: 'gold' },
    { field: 'silver' },
    { field: 'bronze' },
    { field: 'total' },
  ]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      flex: 1,
      minWidth: 150,
      editable: true,
      enableCellChangeFlash: true
    };
  }, []);

  const getRowData = (): IOlympicData[] => {
    const rowNodes: IOlympicData[] = [];
    gridRef.current?.api.forEachNode((node: RowNode) => {
      rowNodes.push(node.data);
    });
    return rowNodes;
  }

  const handleCellChange = () => {
    console.log(getRowData());
  }


  return (
    <>
      <div style={containerStyle}>
        <div style={gridStyle} className="ag-theme-alpine">
          <AgGridReact<IOlympicData>
            ref={gridRef}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            onCellValueChanged={handleCellChange}
          ></AgGridReact>
        </div>
      </div>
    </>

  );
}

export default App;
