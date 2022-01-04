const { widget } = figma;
const { AutoLayout, Frame, Ellipse, Rectangle, Text, useSyncedState, useSyncedMap, useEffect } = widget;

const GRID_PADDING = 24;
const DOT_RADIUS = 5;
const CELL_SIZE = 48;
const BORDER_STROKE = 4;
const NUMBER_FONT_SIZE = 24;
const CROSS_FONT_SIZE = 18;
const CROSS_WIDTH = CROSS_FONT_SIZE;

function showRadioButton(label: string, value: string, cellKey: string, cellContents: string) {
  return `
  <div>
      <input type="radio" id="cellStatus-${cellKey}-${label}" name="cellStatus" value="${label}" ${cellContents == value ? "checked" : ""}>
      <label for="cellStatus${label}">${label}</label>
    </div>
  `
}

function handleRadioClick(label: string, value: string, cellKey: string) {
  return `
  const input${label} = document.getElementById("cellStatus-${cellKey}-${label}");
  input${label}.addEventListener("click", () => {
    parent.postMessage({
      pluginMessage: {
        cellKey: "${cellKey}",
        contents: "${value}",
      },
    }, '*');
  })
  `
}

function showEditorForCell(cellKey: string, cellContents: string) {
  figma.showUI(`
    <h3>Select a value for the cell:</h3>
    ${showRadioButton("0", "0", cellKey, cellContents)}  
    ${showRadioButton("1", "1", cellKey, cellContents)}  
    ${showRadioButton("2", "2", cellKey, cellContents)}  
    ${showRadioButton("3", "3", cellKey, cellContents)}  
    ${showRadioButton("None", "", cellKey, cellContents)}
    <script>
      ${handleRadioClick("0", "0", cellKey)}  
      ${handleRadioClick("1", "1", cellKey)}  
      ${handleRadioClick("2", "2", cellKey)}  
      ${handleRadioClick("3", "3", cellKey)}  
      ${handleRadioClick("None", "", cellKey)}
    </script>
  `)
}

function Dots({ m, n }: { m: number; n: number }) {
  return Array(m + 1)
    .fill(0)
    .map((_, row) =>
      Array(n + 1)
        .fill(0)
        .map((_, col) => (
          <Ellipse
            x={GRID_PADDING - DOT_RADIUS + row * CELL_SIZE}
            y={GRID_PADDING - DOT_RADIUS + col * CELL_SIZE}
            width={DOT_RADIUS * 2}
            height={DOT_RADIUS * 2}
            fill="#000000"
          />
        ))
    );
}

function CellNumber({ i, j, valuesMap }: { i: number, j: number, valuesMap: SyncedMap<string> }) {
  const key = `number-${i}-${j}`
  const value = valuesMap.get(key) ?? ''
  return (
    <AutoLayout
      y={GRID_PADDING + i * CELL_SIZE}
      x={GRID_PADDING + j * CELL_SIZE}
      width={CELL_SIZE}
      height={CELL_SIZE}
      horizontalAlignItems="center"
      verticalAlignItems="center"
      onClick={() => {
        showEditorForCell(key, value)
        return new Promise<void>(() => {})
      }}
    >
      <Text fontSize={NUMBER_FONT_SIZE}>{value}</Text>
    </AutoLayout>
  )
}

function Numbers({ values }: { values: number[][] }) {
  const valuesMap = useSyncedMap<string>("cells");
  useEffect(() => {
    figma.ui.onmessage = ({ contents, cellKey }) => {
      valuesMap.set(cellKey, contents)
      figma.closePlugin()
    }
  })
  return values.map((row: number[], i: number) =>
    row.map((value: number, j: number) => (
      <CellNumber i={i} j={j} valuesMap={valuesMap}/>
    ))
  );
}

enum BorderState {
  EMPTY = 0,
  FILLED,
  CROSSED
}

function HorizontalBorder({ i, j }: { i: number; j: number }) {
  const key = `horizontal-border-${i}-${j}`
  const [state, setState] = useSyncedState(key, BorderState.EMPTY)
  return (
    <Frame 
      width={CELL_SIZE}
      height={BORDER_STROKE + CROSS_FONT_SIZE} 
      x={GRID_PADDING + j * CELL_SIZE}
      y={GRID_PADDING - BORDER_STROKE / 2 - CROSS_FONT_SIZE/2 + i * CELL_SIZE}
      >
      {/* don't ask me about these coordinates i'm not a frontend dev... */}
      <Text 
        x={CELL_SIZE/2}
        y={BORDER_STROKE-CROSS_FONT_SIZE/2+2}
        fill={'#ff0000'}
        hidden={state == BorderState.CROSSED ? false : true}
        horizontalAlignText="center"
        verticalAlignText="bottom"
        textCase="small-caps"
        fontWeight="bold"
        fontSize={CROSS_FONT_SIZE}
        fontFamily="Roboto Mono"
      >x</Text>
      <Rectangle 
        x={0}
        y={CROSS_FONT_SIZE/2}
        width={CELL_SIZE}
        height={BORDER_STROKE}
        fill={'#000000'}
        opacity={state == BorderState.FILLED ? 1 : 0}
        onClick={() => setState((filled) => (filled + 1) % 3)}
      />
    </Frame>
      )
}

function VerticalBorder({ i, j }: { i: number; j: number }) {
  const key = `vertical-border-${i}-${j}`
  const [state, setState] = useSyncedState(key, BorderState.EMPTY)
  return (
    <Frame 
      width={BORDER_STROKE + CROSS_WIDTH} 
      height={CELL_SIZE} 
      x={GRID_PADDING - BORDER_STROKE / 2 - CROSS_WIDTH/2 + j * CELL_SIZE}
      y={GRID_PADDING + i * CELL_SIZE}
      >
      {/* don't ask me about these coordinates i'm not a frontend dev... */}
      <Text 
        x={BORDER_STROKE / 2 + CROSS_WIDTH / 2 - 1}
        y={CELL_SIZE/2 - CROSS_FONT_SIZE + 2}
        fill={'#ff0000'}
        hidden={state == BorderState.CROSSED ? false : true}
        horizontalAlignText="center"
        textCase="small-caps"
        fontWeight="bold"
        fontSize={CROSS_FONT_SIZE}
        fontFamily="Roboto Mono"
      >x</Text>
      <Rectangle 
        x={CROSS_WIDTH/2}
        y={0}
        width={BORDER_STROKE}
        height={CELL_SIZE}
        fill={'#000000'}
        opacity={state == BorderState.FILLED ? 1 : 0}
        onClick={() => setState((filled) => (filled + 1) % 3)}
      />
    </Frame>
  )
}

function Borders({m,n}: {m: number, n: number}) {
  const horizontalBorders = Array(m+1).fill(0).map((_, row) => 
    Array(n).fill(0).map((_, col) => (
      <HorizontalBorder i={row} j={col} />
    ))
  )
  const verticalBorders = Array(m).fill(0).map((_, row) => (
    Array(n+1).fill(0).map((_, col) => (
      <VerticalBorder i={row} j={col} />
    ))
  ))
  return horizontalBorders.concat(verticalBorders)
}


function Widget() {
  const values: number[][] = [
    [0, 0],
    [3, 0],
  ];
  const m = values.length;
  const n = values[0].length;

  return (
    <Frame
      width={m * CELL_SIZE + 2 * GRID_PADDING}
      height={n * CELL_SIZE + 2 * GRID_PADDING}
      fill={"#FFFFFF"}
    >
      <Numbers values={values} />
      <Dots m={m} n={n} />
      <Borders m={m} n={n} />
    </Frame>
  );
}

widget.register(Widget);
