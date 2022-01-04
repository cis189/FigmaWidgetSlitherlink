const { widget } = figma;
const { AutoLayout, Frame, Ellipse, Rectangle, Text, useSyncedState } = widget;

const GRID_PADDING = 24;
const DOT_RADIUS = 5;
const CELL_SIZE = 48;
const BORDER_STROKE = 4;
const NUMBER_FONT_SIZE = 24;

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

function Numbers({ values }: { values: number[][] }) {
  return values.map((row: number[], i: number) =>
    row.map((value: number, j: number) => (
      <AutoLayout
        y={GRID_PADDING + i * CELL_SIZE}
        x={GRID_PADDING + j * CELL_SIZE}
        width={CELL_SIZE}
        height={CELL_SIZE}
        horizontalAlignItems="center"
        verticalAlignItems="center"
      >
        <Text fontSize={NUMBER_FONT_SIZE}>{value}</Text>
      </AutoLayout>
    ))
  );
}

interface Cell {
  row: number;
  col: number;
  value: number;
}

function HorizontalBorder({ i, j }: { i: number; j: number }) {
  const key = `horizontal-border-${i}-${j}`
  const [filled, setFilled] = useSyncedState(key, false)
  return (
    <Rectangle 
      x={GRID_PADDING + j * CELL_SIZE}
      y={GRID_PADDING - BORDER_STROKE / 2 + i * CELL_SIZE}
      width={CELL_SIZE}
      height={BORDER_STROKE}
      fill={'#000000'}
      opacity={filled ? 1 : 0}
      onClick={() => setFilled((filled) => !filled)}
    />
  )
}

function VerticalBorder({ i, j }: { i: number; j: number }) {
  const key = `vertical-border-${i}-${j}`
  const [filled, setFilled] = useSyncedState(key, false)
  return (
    <Rectangle 
      x={GRID_PADDING - BORDER_STROKE / 2 + j * CELL_SIZE}
      y={GRID_PADDING + i * CELL_SIZE}
      width={BORDER_STROKE}
      height={CELL_SIZE}
      fill={'#000000'}
      opacity={filled ? 1 : 0}
      onClick={() => setFilled((filled) => !filled)}
    />
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
