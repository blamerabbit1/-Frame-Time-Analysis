import "./App.css";
import { styled } from "@mui/material/styles";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Tooltip from "@mui/material/Tooltip";
import { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import Colors from "./components/Colors";
import ChartTypes from "./components/ChartTypes";
import Misc from "./components/Misc";
import Aggregation from "./components/Aggregation";
import Charts from "./components/Charts";
import ReadMe from "./components/ReadMe";
import PresentMon from "./components/PresentMon";
import processFiles from "./components/processFiles";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  color: theme.palette.text.secondary,
}));

const initialColors = [
  { r: 255, g: 0, b: 0, a: 1 },
  { r: 0, g: 255, b: 0, a: 1 },
  { r: 0, g: 0, b: 255, a: 1 },
  { r: 255, g: 255, b: 0, a: 1 },
  { r: 255, g: 0, b: 255, a: 1 },
  { r: 0, g: 255, b: 255, a: 1 },
  { r: 127, g: 0, b: 0, a: 1 },
  { r: 0, g: 127, b: 0, a: 1 },
  { r: 0, g: 0, b: 127, a: 1 },
  { r: 127, g: 127, b: 0, a: 1 },
  { r: 127, g: 0, b: 127, a: 1 },
  { r: 0, g: 127, b: 127, a: 1 },
];

const initialChartTypes = [
  { type: "Info", show: true },
  { type: "Scatter: FPS", show: true },
  { type: "Scatter: ms", show: false },
  { type: "Line: FPS", show: false },
  { type: "Line: ms", show: false },
  { type: "L: Percentiles", show: true },
  { type: "L: Lows", show: true },
  { type: "Bar: Variation", show: false },
  { type: "Bar: Default Metrics", show: true },
];

const initialVariationThresholds = [
  { type: "<", threshold: 2, color: "rgb(0,80,0)" },
  { type: "<", threshold: 3, color: "rgb(34,139,34)" },
  { type: "<", threshold: 4, color: "rgb(154,205,50)" },
  { type: "<", threshold: 5, color: "rgb(255,255,0)" },
  { type: "<", threshold: 6, color: "rgb(255,165,0)" },
  { type: ">=", threshold: 6, color: "rgb(255,0,0)" },
];

const values = [];
for (let i = 5; i >= 0.005; i = parseFloat((i - 0.005).toFixed(3))) {
  values.push(i);
}

const exportStyle = document.createElement("style");
document.head.append(exportStyle);

async function exportPage(type) {
  const offset =
    document.getElementsByClassName("hide-for-export")[0].offsetLeft;

  exportStyle.innerHTML = `
    .hide-for-export {
      display: none !important;
    }

    #watermark {
      display: block !important;
    }

    .MuiTooltip-popper {
      display: none !important;
    }
  `;

  await new Promise((resolve) => {
    const check = setInterval(() => {
      if (
        offset !==
        document.getElementsByClassName("hide-for-export")[0].offsetLeft
      ) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });

  html2canvas(document.body, {
    scrollY: 0,
    height: document.body.scrollHeight,
  }).then((canvas) =>
    canvas.toBlob((blob) => {
      if (type === "file") {
        saveAs(blob, "export.png");
      } else {
        navigator.clipboard.write([
          new window.ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
      }

      exportStyle.innerHTML = "";
    })
  );
}

export default function App() {
  const [benches, setBenches] = useState({ benches: [], extremes: {} });

  const [colors, setColors] = useState(() => {
    const storedColors = JSON.parse(localStorage.getItem("colors")) ?? [];

    return storedColors.length === initialColors.length
      ? storedColors
      : initialColors;
  });

  useEffect(
    () => localStorage.setItem("colors", JSON.stringify(colors)),
    [colors]
  );

  const [chartTypes, setChartTypes] = useState(() => {
    const storedChartTypes =
      JSON.parse(localStorage.getItem("chart_types")) ?? [];

    if (
      JSON.stringify(storedChartTypes.map((entry) => entry.type)) !==
      JSON.stringify(initialChartTypes.map((entry) => entry.type))
    ) {
      return initialChartTypes;
    }

    return storedChartTypes;
  });

  useEffect(
    () => localStorage.setItem("chart_types", JSON.stringify(chartTypes)),
    [chartTypes]
  );

  const [chartsPerRow, setChartsPerRow] = useState(
    () => parseInt(localStorage.getItem("charts_per_row"), 10) || 2
  );

  useEffect(
    () => localStorage.setItem("charts_per_row", chartsPerRow),
    [chartsPerRow]
  );

  const [variationThresholds, setVariationThresholds] = useState(() => {
    const storedVariationThresholds =
      JSON.parse(localStorage.getItem("variation_thresholds")) ?? [];

    if (
      JSON.stringify(storedVariationThresholds.map((entry) => entry.color)) !==
      JSON.stringify(initialVariationThresholds.map((entry) => entry.color))
    ) {
      return initialVariationThresholds;
    }
    return storedVariationThresholds;
  });

  useEffect(
    () =>
      localStorage.setItem(
        "variation_thresholds",
        JSON.stringify(variationThresholds)
      ),
    [variationThresholds]
  );

  return (
    <Container maxWidth={false} style={{ padding: 0 }}>
      <Stack
        className="hide-for-export"
        spacing={1}
        style={{ position: "fixed", top: 0, right: 0 }}
      >
        {benches.benches.length > 0 && (
          <>
            <Tooltip title={<div className="tooltip">Download as PNG</div>}>
              <IconButton color="primary" onClick={() => exportPage("file")}>
                <PhotoCamera fontSize="large" />
              </IconButton>
            </Tooltip>
            <Tooltip title={<div className="tooltip">Export to clipboard</div>}>
              <IconButton
                color="primary"
                onClick={() => exportPage("clipboard")}
              >
                <ContentCopyIcon fontSize="large" />
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title={<div className="tooltip">Upload benchmarks</div>}>
          <IconButton color="primary" component="label">
            <input
              hidden
              multiple
              accept=".csv, .json"
              type="file"
              onChange={(ev) =>
                processFiles(
                  ev,
                  benches,
                  setBenches,
                  values,
                  variationThresholds
                )
              }
            />
            <FileUploadIcon fontSize="large" />
          </IconButton>
        </Tooltip>
      </Stack>
      {benches.benches.length < 1 ? (
        <Item>
          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            divider={<Divider orientation="vertical" flexItem />}
          >
            <Colors colors={colors} setColors={setColors} />
            <ChartTypes
              chartTypes={chartTypes}
              setChartTypes={setChartTypes}
              variationThresholds={variationThresholds}
              setVariationThresholds={setVariationThresholds}
            />
            <Misc
              chartsPerRow={chartsPerRow}
              setChartsPerRow={setChartsPerRow}
            />
            <Aggregation />
            <ReadMe />
            <PresentMon />
          </Stack>
        </Item>
      ) : (
        <>
          <Charts
            benches={benches}
            setBenches={setBenches}
            colors={colors}
            chartTypes={chartTypes}
            variationThresholds={variationThresholds}
            chartsPerRow={chartsPerRow}
            Item={Item}
            values={values}
          />
          <div id="watermark" style={{ display: "none" }}>
            <div style={{ textAlign: "center", padding: "16px" }}>
              https://boringboredom.github.io/Frame-Time-Analysis/
            </div>
          </div>
        </>
      )}
    </Container>
  );
}
