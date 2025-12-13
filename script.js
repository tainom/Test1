
const frame = document.getElementById("videoRange");
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

// 透過画像の位置やスケール
let currentPosX = 0;
let currentPosY = 0;
let currentScale = 1;

// 透過画像の位置やスケール(移動時に覚えておくため)
let startX = 0;
let startY = 0;
let startPosX = 0;
let startPosY = 0;
let startDistance = 0;
let startScale = 1;


// カメラ起動
async function startCamera() {
    try {
        // まずはカメラを起動（解像度は任せる）
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 4096 },
                height: { ideal: 4096 },
                facingMode: "environment"
            }
        });
        video.srcObject = stream;
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

function getDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateTransform() {
    overlayImg.style.transform =
    `translate(calc(-50% + ${currentPosX}px), calc(-50% + ${currentPosY}px)) scale(${currentScale})`;
}

// スマホで透過画像を1本指or2本指でタッチしたとき
// タッチした座標を覚えておく
overlayImg.addEventListener("touchstart", (e) => {
    if (e.touches.length == 1) {
        // 1本指 → 移動
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startPosX = currentPosX;
        startPosY = currentPosY;

    } else if (e.touches.length == 2) {
        // 2本指 → ピンチ拡大縮小
        startDistance = getDistance(e.touches);
        initScale = currentScale;
    }
});

// スマホで透過画像をタッチしたまま動かしたとき
// 元の座標からの移動量で透過画像の移動量も計算する
overlayImg.addEventListener("touchmove", (e) => {
    e.preventDefault();

    if (e.touches.length == 1) {
        // 移動
        const dx = e.touches[0].clientX - startX;
        const dy = e.touches[0].clientY - startY;

        currentPosX = startPosX + dx;
        currentPosY = startPosY + dy;
    } else if (e.touches.length == 2) {
        // 拡大縮小
        const newDistance = getDistance(e.touches);
        currentScale = initScale * (newDistance / startDistance);
    }
    updateTransform();
});

// canvasのサイズをカメラ映像に合わせて縦3横4の比率に修正
function resizeCanvasTo34() {
    let w = window.innerWidth;
    let h = Math.min(window.innerHeight, w * 4 / 3);

    // 解像度を改善
    w = video.videoWidth;
    h = video.videoHeight;

    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    canvas.width = w;
    canvas.height = h;
}

// 撮影処理（撮影後すぐ新しいタブで開く）
captureBtn.addEventListener("click", () => {
    // canvasのサイズをカメラ映像に合わせて縦3横4の比率に修正
    resizeCanvasTo34();

    hideUI();

    // canvasのサイズを取得
    let canvasW = canvas.width;
    let canvasH = canvas.height;
    
    // 透過画像のサイズを計算(デフォルトでは元画像の50%で、そこから拡大縮小している)
    let overlayW = canvasW * 0.5 * currentScale;
    let overlayH = canvasH * 0.5 * currentScale;

    // 透過画像の基準点(移動していないと考えた時の左上の点)を計算
    const defaultX = canvasW * 0.5 - overlayW * 0.5;
    const defaultY = canvasH * 0.5 - overlayH * 0.5;

    // 透過画像の左上の点を計算
    let overlayX = defaultX + currentPosX;
    let overlayY = defaultY + currentPosY;

    // 解像度を改善
    // const maxScale = Math.floor(Math.min(2000 / canvasW, 2000 / canvasH));
    // canvasW *= maxScale;
    // canvasH *= maxScale;
    // overlayX *= maxScale;
    // overlayY *= maxScale;
    // overlayW *= maxScale;
    // overlayH *= maxScale;
    // console.log(canvasW, canvasH);

    // カメラ映像(画面に映っているもの)と透過画像をcanvasに描画
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvasW, canvasH);
    //alert(canvasW, canvasH);
    ctx.drawImage(overlayImg, overlayX, overlayY, overlayW, overlayH);
    console.log(overlayX, overlayY, overlayW, overlayH);

    // PNGとして保存
    //const url = canvas.toDataURL("image/png");

    showUI();
      
    const url = canvas.toDataURL("image/png");

    // ✅ 別タブを開く（iPhoneでは必ずタブになる）
    const win = window.open("save.html", "_blank");

    if (!win) {
        alert("別タブを開けませんでした（ポップアップブロック）");
        return;
    }

    // ✅ 別タブが読み込まれるまで少し待つ（iPhone Safari 対策）
    const sendData = () => {
        win.postMessage(url, "*");
    };

    // ✅ iPhone Safari は load イベントが遅れるので両方使う
    win.onload = () => sendData();

    // ✅ 念のため遅延送信（iPhoneで確実に届く）
    setTimeout(sendData, 500);

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
        overlayImg.src = getSelectedFilePath();

        // タブ(ポーズor表情)を初期化
        setupTabs();

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
