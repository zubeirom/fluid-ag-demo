import { useEffect, useMemo, useRef, useState } from 'react';
import { data } from './data';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, RowNode } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import './App.css';
import TinyliciousClient from '@fluidframework/tinylicious-client';
import { SharedMap } from 'fluid-framework';

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

const client = new TinyliciousClient();
const containerSchema = { initialObjects: { sharedGrid: SharedMap } };
const gridData = 'gridData';

const getFluidData = async () => {
  let container;
  const containerId = window.location.hash.substring(1);
  if (!containerId) {
    ({ container } = await client.createContainer(containerSchema));
    const id = await container.attach();
    window.location.hash = id;
  } else {
    ({ container } = await client.getContainer(containerId, containerSchema));
  }

  return container.initialObjects;
};

function App() {
  const gridRef = useRef<AgGridReact>(null);
  const containerStyle = useMemo(() => ({ width: '100%', height: '850px' }), []);
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const [rowData, setRowData] = useState<IOlympicData[]>(data);
  const [fluidSharedObjects, setFluidSharedObjects] = useState<{sharedGrid: SharedMap}>();
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
    if(fluidSharedObjects) {
      const { sharedGrid } = fluidSharedObjects;
      sharedGrid.set(gridData, getRowData());
    }
  }

  const setGridRowData = (rowData: IOlympicData[]) => {
    gridRef.current?.api.setRowData(rowData);
  }

  useEffect(() => {
    getFluidData().then((sharedObjects: any) => {
      setFluidSharedObjects(sharedObjects);
    });
  }, []);

  useEffect(() => {
    if(fluidSharedObjects) {
      const { sharedGrid } = fluidSharedObjects;
      const updateGrid = () => {
        if(sharedGrid) {
          const newData = sharedGrid.get(gridData);
          if(newData) {
            setGridRowData(newData)
          }
        }
      }

      updateGrid();
      sharedGrid.on('valueChanged', updateGrid);

      return () => { sharedGrid.off('valueChanged', updateGrid); }
    } else {
      return;
    }
  }, [fluidSharedObjects])


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
