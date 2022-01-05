const { widget } = figma;
const { AutoLayout, Frame, Ellipse, Rectangle, SVG, Text, useSyncedState, useSyncedMap, useEffect } = widget;

const GRID_PADDING = 24;
const DOT_RADIUS = 5;
const CELL_SIZE = 48;
const BORDER_STROKE = 4;
const NUMBER_FONT_SIZE = 24;
const CROSS_FONT_SIZE = 18;
const CROSS_WIDTH = CROSS_FONT_SIZE;
const BUTTON_SIZE = 32;

const buttonSrcRight = `
  <svg width="${BUTTON_SIZE}" height="${BUTTON_SIZE}" viewBox="0 0 ${BUTTON_SIZE} ${BUTTON_SIZE}" fill="none">
  <circle cx="${BUTTON_SIZE/2}" cy="${BUTTON_SIZE/2}" r="${BUTTON_SIZE/2 - 0.5}" stroke="black" stroke-opacity="0.1" fill="white"/>
  <path transform="translate(${BUTTON_SIZE/2 - 4} ${BUTTON_SIZE/2 - 8})" fill="black" fill-opacity="0.8" d="M0 0 L4 0 L10 8 L4 16 L0 16 L6 8 Z"></path>
  </svg>
`

const buttonSrcDown = `
<svg width="${BUTTON_SIZE}" height="${BUTTON_SIZE}" viewBox="0 0 ${BUTTON_SIZE} ${BUTTON_SIZE}" fill="none">
<circle cx="${BUTTON_SIZE/2}" cy="${BUTTON_SIZE/2}" r="${BUTTON_SIZE/2 - 0.5}" stroke="black" stroke-opacity="0.1" fill="white"/>
<path transform="translate(${BUTTON_SIZE/2 + 8} ${BUTTON_SIZE/2 - 4}); rotate(90)" fill="black" fill-opacity="0.8" d="M0 0 L4 0 L10 8 L4 16 L0 16 L6 8 Z"></path>
</svg>
`

const buttonSrcOk = `
<svg width="${BUTTON_SIZE}" height="${BUTTON_SIZE}" viewBox="0 0 ${BUTTON_SIZE} ${BUTTON_SIZE}" fill="none">
<circle cx="${BUTTON_SIZE/2}" cy="${BUTTON_SIZE/2}" r="${BUTTON_SIZE/2 - 0.5}" stroke="black" stroke-opacity="0.1" fill="white"/>
</svg>
`

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

function CellNumber({ initValue, i, j }: { initValue: string, i: number, j: number }) {
  const key = `number-${i}-${j}`
  const valuesMap = useSyncedMap<string>("cells")
  const value = valuesMap.get(key) ?? initValue
  return (
    <AutoLayout
      x={GRID_PADDING + j * CELL_SIZE}
      y={GRID_PADDING + i * CELL_SIZE}
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

function Numbers({ n, m, initValues }: { n: number, m: number, initValues: number[][] }) {
  const valuesMap = useSyncedMap<string>("cells")
  useEffect(() => {
    figma.ui.onmessage = ({ contents, cellKey }) => {
      valuesMap.set(cellKey, contents)
      figma.closePlugin()
    }
  })
  return Array(n).fill(0).map((_, row) =>
    Array(m).fill(0).map((_, col) => {
      const value = (row < initValues.length && col < initValues[0].length) ? initValues[row][col] : ''
      return (
      <CellNumber initValue={`${value}`} i={row} j={col}/>
      )
    })
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
        fill={'#b80f0a'}
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
        fill={'#b80f0a'}
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

function ResizeButtons() {
  const [n, setN] = useSyncedState('n', 0);
  const [m, setM] = useSyncedState('m', 0);
  const [visible, setVisible] = useSyncedState('resizeVisible', true);
  return (
    <AutoLayout
      x={0}
      y={0}
      width={BUTTON_SIZE}
      height={BUTTON_SIZE*3 + BORDER_STROKE*2}
      direction="vertical"
      fill="#fff"
      cornerRadius={8}
      spacing={BORDER_STROKE}
      hidden={!visible}
    >
      <SVG
        src={buttonSrcRight}
        onClick={() => {
          setM(m => m+1)
        }}
        />
      <SVG
        src={buttonSrcDown}
        onClick={() => {
          setN(n => n+1)
        }}
      />
      <Frame 
        width={BUTTON_SIZE} 
        height={BUTTON_SIZE}
        onClick={() => {
          setVisible(false)
        }}
      >
      <SVG
        src={buttonSrcOk}
      />
      <Text 
        horizontalAlignText="center" 
        fontSize={CROSS_FONT_SIZE}
        x={BUTTON_SIZE/2} 
        y={BUTTON_SIZE/2 - CROSS_FONT_SIZE/2}
      >
      ✔
      </Text>
      </Frame>
    </AutoLayout>
  )
}


function Widget() {
  const values: number[][] = [
    [0],
  ];
  const [n, setN] = useSyncedState('n', values.length);
  const [m, setM] = useSyncedState('m', values[0].length);
  const [visible, setVisible] = useSyncedState('resizeVisible', true);


  return (
    <Frame
      width={3 + m*CELL_SIZE + 2*GRID_PADDING + (visible ? BUTTON_SIZE : 0)}
      height={3 + Math.max(n*CELL_SIZE + 2*GRID_PADDING, (visible ? BUTTON_SIZE*3.5 + BORDER_STROKE * 2 : 0))}
    >
      <Frame
        x={visible ? BUTTON_SIZE : 0}
        width={m * CELL_SIZE + 2 * GRID_PADDING}
        height={n * CELL_SIZE + 2 * GRID_PADDING}
        fill={'#ffffff'}
        stroke={'#e6e6e6'}
        strokeWidth={0.5}
        cornerRadius={3}
        effect={{
          type: 'drop-shadow',
          color: { r: 0, g: 0, b: 0, a: 0.2 },
          offset: { x: 0, y: 0 },
          blur: 5,
          spread: 5,
        }}
      >
        <Numbers m={m} n={n} initValues={values} />
        <Dots m={m} n={n} />
        <Borders m={m} n={n} />
      </Frame>
      <Frame
        width={BUTTON_SIZE}
        height={BUTTON_SIZE*3 + BORDER_STROKE*2}
        y={BUTTON_SIZE*0.5}
      >
        <ResizeButtons />
      </Frame>
    </Frame>
  );
}

widget.register(Widget);
