
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const overlayImg = document.getElementById("overlayImg");
const captureBtn = document.getElementById("capture");
const togglePreview = document.getElementById("togglePreview");
const tabSelectorMode = document.getElementById("tabSelectorMode");
const selectorPreview = document.getElementById("selectorPreview");

// JSONから読み込むデータ
let directryStructure = null;
let listStructure = null;

// ポーズと表情の選択状態
let currentMode = "pose";
let currentPose = null;
let currentFace = null;

// サムネイルの選択状態
let currentThumb = null;

// カメラ起動
async function startCamera() {
    try {
        // まずはカメラを起動（解像度は任せる）
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "environment"
            }
        });

        video.srcObject = stream;

        // メタデータ読み込み（解像度が確定する）
        await new Promise(resolve => {
            video.onloadedmetadata = resolve;
        });

        const vw = video.videoWidth;
        const vh = video.videoHeight;

        console.log("実際のカメラ解像度:", vw, vh);

        // 画面サイズ（ベース）
        const baseW = window.innerWidth;
        const baseH = window.innerHeight;

        // ✅ 整数倍を計算（カメラ解像度を超えない最大の整数倍）
        const scale = Math.floor(Math.min(vw / baseW, vh / baseH));

        console.log("整数倍スケール:", scale);

        // ✅ Canvas の最終解像度
        canvas.width = baseW * scale;
        canvas.height = baseH * scale;

        console.log("Canvas解像度:", canvas.width, canvas.height);

    } catch (err) {
        alert("カメラにアクセスできません: " + err.message);
    }
}


// すべてのUIを非表示
function hideUI() {
    document.querySelectorAll(".ui").forEach(el => {
        el.style.display = "none";
    });
}

// すべてのUIを表示
function showUI() {
    document.querySelectorAll(".ui").forEach(el => {
        el.style.display = "";
    });
}
// プレビュー用のポーズファイルに対応するパスを取得する
function getPreviewPoseFilePath(name) {
    return "List/pose/" + name + ".png";
}

// プレビュー用の表情ファイルに対応するパスを取得する
function getPreviewFaceFilePath(name) {
    return "List/face/" + name + ".png";
}

// 選択中のファイルに対応するパスを取得する
function getSelectedFilePath() {
    return "Dataset/" + currentPose + "/" + currentFace + "/front.png";
}

// 描画
async function renderUI() {
    // 前の要素をクリアしてから追加
    selectorPreview.innerHTML = "";

    // 現在のモードに応じてファイル一覧を取得
    console.log(listStructure);
    if (!listStructure){
        return;
    }
    const files = listStructure[currentMode];
    console.log(files);
    files.forEach(file => {
        const name = file["name"];
        const img = document.createElement("img");
        if (currentMode == "pose") {
            const posePath = getPreviewPoseFilePath(name);
            img.className = "thumb";
            img.src = posePath;
            img.setAttribute("pose", name);
        } else {
            const facePath = getPreviewFaceFilePath(name);
            img.className = "thumb";
            img.src = facePath;
            img.setAttribute("face", name);
        }
        selectorPreview.appendChild(img);
    });
}

// タブの設定
function setupTabs() {
  const tabs = document.querySelectorAll("#tabSelectorMode .tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      // タブの見た目切り替え
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      // モード切り替え
      currentMode = tab.getAttribute("data-mode");
      renderUI();
    });
  });
}

// 三角ボタンクリック
document.getElementById("togglePreview").addEventListener("click", () => {
    togglePreview.classList.toggle("minimized");
    selectorPreview.classList.toggle("minimized");
    tabSelectorMode.classList.toggle("minimized");
    captureBtn.classList.toggle("minimized");

    const btn = document.getElementById("togglePreview");
    if (selectorPreview.classList.contains("minimized")) {
        btn.textContent = "▲"; // 最小化時は上三角に
    } else {
        btn.textContent = "▼"; // 展開時は下三角に
    }
});

// サムネイルクリックで切り替え
document.getElementById("selectorPreview").addEventListener("click", (event) => {
    if (event.target.classList.contains("thumb")) {
        const thumb = event.target;

        // overlay画像を切り替え
        if (currentMode == "pose"){
            currentPose = thumb.getAttribute("pose");
        } else {
            currentFace = thumb.getAttribute("face");
        }
        overlayImg.src = getSelectedFilePath();

        // 選択状態の見た目を更新
        if (currentThumb){
            currentThumb.classList.remove("active");
        }
        thumb.classList.add("active");

        // 選択中のサムネイルを更新
        currentThumb = thumb;
    }
});

// 撮影処理（撮影後すぐ新しいタブで開く）
captureBtn.addEventListener("click", () => {
    // const w = video.videoWidth;
    // const h = video.videoHeight;
    // canvas.width = w;
    // canvas.height = h;
    // const ctx = canvas.getContext("2d");

    // // カメラ映像を描画
    // ctx.drawImage(video, 0, 0, w, h);
    // if (overlayImg.complete) {
    //     const imgAspect = overlayImg.naturalWidth / overlayImg.naturalHeight;
    //     const canvasAspect = w / h;

    //     let drawW, drawH, offsetX, offsetY;

    //     if (imgAspect > canvasAspect) {
    //         // 画像が横長 → 幅に合わせる
    //         drawW = w;
    //         drawH = w / imgAspect;
    //         offsetX = 0;
    //         offsetY = (h - drawH) / 2;
    //     } else {
    //         // 画像が縦長 → 高さに合わせる
    //         drawH = h;
    //         drawW = h * imgAspect;
    //         offsetX = (w - drawW) / 2;
    //         offsetY = 0;
    //     }

    //     ctx.drawImage(overlayImg, offsetX, offsetY, drawW, drawH);
    // }
  hideUI();

video.addEventListener("loadedmetadata", () => {
  console.log("カメラ準備OK:", video.videoWidth, video.videoHeight);
});

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');

  // カメラ映像を描画
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 透過PNGを重ねる
  ctx.drawImage(overlayImg, 0, 0, canvas.width, canvas.height);

  // PNGとして保存
  const url = canvas.toDataURL('image/png');

  showUI();
      
    // 新しいタブに画像を埋め込んだHTMLを表示
    //const url = canvas.toDataURL("image/png");
    const win = window.open();
    const img = win.document.createElement("img");
    img.src = url;
    img.style.maxWidth = "100%";
    img.style.height = "auto";
    win.document.body.appendChild(img);
});

// 初期化処理(JSON読み込みを初期描画を同期処理するように注意)
async function init() {
    try {
        // JSONを読み込み、終わるまで待機する
        const tmpDirectryStructure = await fetch("directry.json");
        const tmpListStructure = await fetch("list.json");
        directryStructure = await tmpDirectryStructure.json();
        listStructure = await tmpListStructure.json();
        console.log("JSON読み込み完了:", directryStructure, listStructure);

        // ポーズと表情の初期化
        currentPose = listStructure["pose"][0]["name"];
        currentFace = listStructure["face"][0]["name"];

        setupTabs()

        // 初期描画
        renderUI();

        // カメラ起動
        startCamera();
    } catch (err) {
        console.error("読み込み失敗:", err);
    }
}

// 初期化処理(DOMが読み込まれてから)
document.addEventListener("DOMContentLoaded", init);
