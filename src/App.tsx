import 'ag-grid-enterprise'
import { useEffect, useMemo, useRef, useState } from 'react';
import { data } from './data';
import { AgGridReact } from 'ag-grid-react';
import { CellValueChangedEvent, ColDef, RowNode } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import TinyliciousClient, { TinyliciousAudience } from '@fluidframework/tinylicious-client';
import { SharedMap } from 'fluid-framework';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container, Navbar } from 'react-bootstrap';

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
  let initContainer;
  let initServices;
  const containerId = window.location.hash.substring(1);
  if (!containerId) {
    const { container, services } = await client.createContainer(containerSchema);
    initContainer = container;
    initServices = services;
    const id = await container.attach();
    window.location.hash = id;
  } else {
    const { container, services } = await client.getContainer(containerId, containerSchema);
    initContainer = container;
    initServices = services;
  }

  return { fso: initContainer.initialObjects, fs: initServices };
};

function App() {
  const gridRef = useRef<AgGridReact>(null);
  const containerStyle = useMemo(() => ({ height: '350px' }), []);
  const gridStyle = useMemo(() => ({ height: '100%', width: '100%' }), []);
  const [rowData, setRowData] = useState<IOlympicData[]>(data);
  const [audience, setAudience] = useState<number>(0);
  const [fluidSharedObjects, setFluidSharedObjects] = useState<{ sharedGrid: SharedMap }>();
  const [fluidServices, setFluidServices] = useState<{audience: TinyliciousAudience}>();
  const [columnDefs, setColumnDefs] = useState<ColDef[]>([
    { field: 'athlete' },
    { field: 'age' },
    { field: 'country' },
  ]);

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      flex: 1,
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

  const handleCellChange = (event: CellValueChangedEvent) => {
    console.info('Cell Value Changed');
    if (fluidSharedObjects) {
      const { sharedGrid } = fluidSharedObjects;
      sharedGrid.set(gridData, getRowData());
    }
  }

  const setGridRowData = (rowData: IOlympicData[]) => {
    gridRef.current?.api.setRowData(rowData);
  }

  useEffect(() => {
    getFluidData().then((payload: {fso: any, fs: any}) => {
      setFluidSharedObjects(payload.fso);
      setFluidServices(payload.fs);
    });
  }, []);

  useEffect(() => {
    if (fluidSharedObjects && fluidServices) {
      const { sharedGrid } = fluidSharedObjects;
      const { audience } = fluidServices;
      const updateGrid = () => {
        if (sharedGrid) {
          const newData = sharedGrid.get(gridData);
          if (newData) {
            setGridRowData(newData)
          }
        }
      }

      updateGrid();
      sharedGrid.on('valueChanged', updateGrid);
      audience.on('membersChanged', () => {setAudience(audience.getMembers().size)})

      return () => { sharedGrid.off('valueChanged', updateGrid); }
    } else {
      return;
    }
  }, [fluidSharedObjects])


  return (
    <>
      <Navbar bg="dark" variant='dark'>
        <Container>
          <Navbar.Brand href="#home">Fluid Demo</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Button variant="info">Zuschauer: {audience}</Button>
            &nbsp;
            &nbsp;
            <Button href='https://github.com/zubeirom/fluid-ag-demo' variant="secondary">GitHub</Button>
          </Navbar.Collapse>
        </Container>
      </Navbar>
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
