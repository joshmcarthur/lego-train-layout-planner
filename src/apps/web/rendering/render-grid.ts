import { nothing, svg } from 'lit';

const STUD = 1;
const MAJOR_INTERVAL = 16;

export function renderGrid(minX: number, minY: number, maxX: number, maxY: number) {
  const minorLines = [];
  const majorLines = [];

  for (let x = minX; x <= maxX; x++) {
    const isMajor = x % MAJOR_INTERVAL === 0;
    const line = svg`
      <line
        class=${isMajor ? 'grid-major' : 'grid-minor'}
        x1=${x * STUD}
        y1=${minY * STUD}
        x2=${x * STUD}
        y2=${maxY * STUD}
      />
    `;
    if (isMajor) {
      majorLines.push(line);
    } else {
      minorLines.push(line);
    }
  }

  for (let y = minY; y <= maxY; y++) {
    const isMajor = y % MAJOR_INTERVAL === 0;
    const line = svg`
      <line
        class=${isMajor ? 'grid-major' : 'grid-minor'}
        x1=${minX * STUD}
        y1=${y * STUD}
        x2=${maxX * STUD}
        y2=${y * STUD}
      />
    `;
    if (isMajor) {
      majorLines.push(line);
    } else {
      minorLines.push(line);
    }
  }

  return svg`${minorLines} ${majorLines}`;
}

export interface OpenEndMarker {
  x: number;
  y: number;
}

export function renderValidationOverlay(
  openEnds: OpenEndMarker[],
  tooltipMessage: string,
  tooltipX: number,
  tooltipY: number,
) {
  return svg`
    ${openEnds.map((marker) => svg`<circle class="open-end" cx=${marker.x} cy=${marker.y} r=${0.6} />`)}
    ${tooltipMessage
      ? svg`
          <g class="tooltip" transform="translate(${tooltipX} ${tooltipY})">
            <rect
              class="tooltip-bg"
              x="-1"
              y="-4"
              width=${tooltipMessage.length * 1.4 + 2}
              height="5"
            />
            <text class="tooltip-text" x="0" y="-1">${tooltipMessage}</text>
          </g>
        `
      : nothing}
  `;
}
