/**
 * NOTE: var in some functions and some strange structures gave significant performance boost
 */
"use strict";

(function() {

    let imgWidth = 1024;
    let imgHeight = 1024;

window.comcuteModule = {

    getStatus: function(_, lang) {
        if (lang === "pl") {
            return {
                description: "Symulacja rozprzestrzeniania sie pożaru na obszarze trójmiasta."
            };
        } else {
            return {
                description: "Fire spreading simulation over Tricity, Poland."
            };
        }
    },

    getInputTasksAmount: function(input) {
        const inputWords = input.split(" ");
        const firefightersCount = inputWords[1];
        return inputWords[2 + firefightersCount * 2];
    },

    drawCanvas: function(canvas, pixels) {
        const ctx = canvas.getContext("2d");
        if (canvas.width != imgWidth || canvas.height != imgHeight) {
            canvas.width  = imgWidth;
            canvas.height = imgHeight;
        }

        const img = ctx.getImageData(0, 0, imgWidth, imgHeight);
        img.data.set(pixels);
        ctx.putImageData(img, 0, 0);
    },

    prepare: function(dataObject, resolve) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            imgWidth  = canvas.width  = this.width;
            imgHeight = canvas.height = this.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(this, 0, 0, imgWidth, imgHeight);

            const imageData = ctx.getImageData(0, 0, imgWidth, imgHeight);
            resolve({
                pixels: imageData.data,
                w: imgWidth,
                h: imgHeight
            });
        }
        img.src = dataObject.substr(0, dataObject.indexOf(" ")); 
    },

    setResponse: function(results) {
        const firefighters = results[0].firefighters;

        let coveredWithFireTotalCnt = 0;
        for (const result of results)
            coveredWithFireTotalCnt += result.damage;

        let response = coveredWithFireTotalCnt + " " + firefighters.length + " ";
        for (var firefighter of firefighters) {
            response += firefighter._x + " "
                      + firefighter._y + " ";
        }

        return response;
    },

    task: function(dataObject) {
        const FIREFIGHTER_AMOUNT_LIMIT = 72.0;
        const BLOCK_SIZE = 32;
        const mapWidth = dataObject.preparedData.w;
        const mapHeight = dataObject.preparedData.h;
        const mapHorizontalBlocks = mapWidth / BLOCK_SIZE;
        const mapVerticalBlocks = mapHeight / BLOCK_SIZE;
        const windDirX = 0.5;
        const windDirY = -0.5;
        let pixels = dataObject.preparedData.pixels;
        let activeBlocks = {};
        let resultCellsData = [];
        let internalCellsData = [];
        let evenCPU = 1;
        const mapData = [];


        function start() {
            const inputData = parseInput(dataObject.data);
            loadMapDataFromImage(inputData.imageURL);

            const fire = inputData.fires[dataObject.inputTaskIndex];
            evenCPU = 1;
            activeBlocks = {};
            initializeSimulationData(inputData.firefighters, fire);
            printMap();

            setProgressGoal(1500 * inputData.fires.length);

            console.time('updateFires');
            for (var i = 0; i <= 1500; i++) {
                simulateCPU();
                if (i % 4 == 0) {
                    updateFire(i);
                    updateProgress(i, pixels);
                } else {
                    updateProgress(i);
                }
            }
            console.timeEnd('updateFires');

            let coveredWithFireCnt = 0;
            for (var x = 0; x < mapWidth; x++) {
                for (var y = 0; y < mapHeight; y++) {
                    if (internalCellsData[x][y].height > 0 && resultCellsData[x][y].maxFireAmount > 0)
                        coveredWithFireCnt++;
                }
            }

            console.log("Damage: " + coveredWithFireCnt / (mapHeight * mapWidth) * 100 + "%");

            return {
                damage: coveredWithFireCnt,
                firefighters: inputData.firefighters,
            }
        }

        function loadMapDataFromImage() {
            // wartosc wysokosci jest dzielona przez ta wartosc przy wczytywaniu mapy
            const yScaler = 200.0;
            // wartosc dodawana do kazdej wysokosci  - pozycjonowanie mapy wzdluz osi y
            const yTransform = -20.0;

            for (var x = 0; x < mapWidth; x++) {
                mapData.push([]);
                for (var y = 0; y < mapHeight; y++) {
                    const index = (y * mapWidth + x) * 4;

                    mapData[x].push({
                        height: Math.trunc((pixels[index] / 256.0) * yScaler + yTransform),
                        forestation: pixels[index + 1],
                        roads: pixels[index + 2],
                        urban: pixels[index + 3]
                    });
                }
            }
        }

        function parseInput(input) {
            const inputWords = input.split(" ");
            const inputData = {
                imageURL: inputWords[0],
                firefighters: [], // of []
                fires: [] // of Point[]
            }

            let index = 2;

            const firefightersCount = inputWords[1];
            for (let i = 0; i < firefightersCount * 2; i += 2) {
                const x = inputWords[index + i];
                const y = inputWords[index + i + 1];
                const point = new Point(x, y);
                inputData.firefighters.push(point);
            }

            index += firefightersCount * 2;
            const testcasesCount = inputWords[index];
            for (let i = 0; i < testcasesCount; i++) {
                const testcase = [];
                index++;
                const firesCount = inputWords[index];

                for (let j = 0; j < firesCount * 2; j += 2) {
                    const x = inputWords[index + 1];
                    const y = inputWords[index + 1 + 1];
                    const point = new Point(x, y);
                    testcase.push(point);
                    index += 2;
                }

                inputData.fires.push(testcase);
            }

            return inputData;
        }

        function initializeSimulationData(firefighters, fires) {
            resultCellsData = [];
            internalCellsData = [];

            for (var x = 0; x < mapWidth; x++) {
                resultCellsData.push([]);
                internalCellsData.push([]);
                for (var y = 0; y < mapHeight; y++) {
                    const md = mapData[x][y];

                    if (md.forestation > 0)
                        md.forestation = 150;
                    if (md.urban > 0)
                        md.urban = 200;

                    const rcd = {
                        fireAmount: 0.0,
                        firefightersAmount: 0.0,
                        maxFireAmount: 0.0,
                        calories: md.forestation,
                    };

                    if (md.height > 0) {
                        rcd.calories += (10.0 + 100.0 / md.height) +
                            Math.floor(Math.random() * 20);
                    }

                    resultCellsData[x].push(rcd);

                    let icd = {
                        fireAmountEven: 0.0,
                        fireAmountOdd: 0.0,
                        firefightersAmountEven: 0.0,
                        firefightersAmountOdd: 0.0,
                        height: md.height,
                        maxCalories: rcd.calories,
                    };
                    internalCellsData[x].push(icd);
                }
            }

            for (var fire of fires)
                initializeFire(fire.x, fire.y);

            for (var firefighter of firefighters)
                initializeFirefighters(firefighter.x, firefighter.y);
        }

        function initializeFire(x, y) {
            setFireAmount(resultCellsData[x][y], 5);

            const fireBlock = new Point(x / BLOCK_SIZE, y / BLOCK_SIZE);
            addToBlocks(activeBlocks, fireBlock);

            propagateToNeighborBlocks(activeBlocks, x, y);
        }

        function initializeFirefighters(x, y) {
            resultCellsData[x][y].firefightersAmount = 5;

            const fireBlock = new Point(x / BLOCK_SIZE, y / BLOCK_SIZE);
            addToBlocks(activeBlocks, fireBlock);

            propagateToNeighborBlocks(activeBlocks, x, y);
        }

        function propagateToNeighborBlocks(blocksObject, x, y) {
            const block = new Point(x / BLOCK_SIZE, y / BLOCK_SIZE);
            const xRest = x % BLOCK_SIZE;
            const yRest = y % BLOCK_SIZE;

            if (xRest == 0 && block.x > 0) {
                addToBlocks(blocksObject, new Point(block.x - 1, block.y));

                if (yRest == BLOCK_SIZE - 1 && block.y < yRest - 1) {
                    addToBlocks(blocksObject, new Point(block.x - 1, block.y + 1));
                    addToBlocks(blocksObject, new Point(block.x, block.y + 1));
                    return;
                } else if (yRest == 0 && block.y > 0) {
                    addToBlocks(blocksObject, new Point(block.x - 1, block.y - 1));
                    addToBlocks(blocksObject, new Point(block.x, block.y - 1));
                    return;
                }
            } else if (xRest == BLOCK_SIZE - 1 && block.x < mapHorizontalBlocks - 1) {
                addToBlocks(blocksObject, new Point(block.x + 1, block.y));

                if (yRest == 0 && block.y > 0) {
                    addToBlocks(blocksObject, new Point(block.x + 1, block.y - 1));
                    addToBlocks(blocksObject, new Point(block.x, block.y - 1));
                    return;
                } else if (yRest == BLOCK_SIZE - 1 && block.y < mapVerticalBlocks - 1) {
                    addToBlocks(blocksObject, new Point(block.x + 1, block.y + 1));
                    addToBlocks(blocksObject, new Point(block.x, block.y + 1));
                    return;
                }
            }

            if (yRest == 0 && block.y > 0) // górny
                addToBlocks(blocksObject, new Point(block.x, block.y - 1));
            else if (yRest == BLOCK_SIZE - 1 && block.y < yRest - 1) // dolny
                addToBlocks(blocksObject, new Point(block.x, block.y + 1));
        }

        function addToBlocks(blocksObject, point) {
            blocksObject[point.hash] = point;
        }

        function printMap() {
            for (var x = 0; x < mapWidth; x++) {
                for (var y = 0; y < mapHeight; y++) {
                    const index = (y * mapWidth + x) * 4;

                    if (internalCellsData[x][y].height > 0) {
                        pixels[index    ] = resultCellsData[x][y].fireAmount;
                        pixels[index + 1] = resultCellsData[x][y].calories;
                        pixels[index + 2] = 0;
                    } else {
                        pixels[index    ] = 0;
                        pixels[index + 1] = 0;
                        pixels[index + 2] = 255;
                    }
                    pixels[index + 3] = 255;
                }
            }

            updateProgress(0, pixels);
        }

        function updateFire() {
            var rcd = null;

            for (var key in activeBlocks) {
                var block = activeBlocks[key];
                var nextBlockX = (block.x + 1) * BLOCK_SIZE;
                var nextBlockY = (block.y + 1) * BLOCK_SIZE;

                for (var x = block.x * BLOCK_SIZE; x < nextBlockX; x++) {
                    for (var y = block.y * BLOCK_SIZE; y < nextBlockY; y++) {
                        var index = (y * mapWidth + x) * 4;

                        if (internalCellsData[x][y].height > 0) {
                            rcd = resultCellsData[x][y];
                            pixels[index    ] = rcd.fireAmount;
                            pixels[index + 1] = rcd.calories;
                            pixels[index + 2] = rcd.firefightersAmount;
                        }
                    }
                }
            }
        }

        function simulateCPU() {
            evenCPU = (evenCPU + 1) % 2;

            simulate(evenCPU == 1);
        }

        function simulate(even) {
            newActiveBlocks = {};

            var internalCellsDataX = null;
            var resultCellsDataX = null;
            var internalCellData = null;
            var resultCellData = null;
            var block = null;

            for (var key in activeBlocks) {
                block = activeBlocks[key];
                var nextBlockX = (block.x + 1) * BLOCK_SIZE;
                var nextBlockY = (block.y + 1) * BLOCK_SIZE;

                newActiveBlocks[key] = new Point(block.x, block.y);

                var stillActive = false;

                for (var x = block.x * BLOCK_SIZE; x < nextBlockX; x++) {
                    internalCellsDataX = internalCellsData[x];
                    resultCellsDataX = resultCellsData[x];

                    for (var y = block.y * BLOCK_SIZE; y < nextBlockY; y++) {
                        internalCellData = internalCellsDataX[y];
                        if (internalCellData.height < 0)
                            continue;

                        resultCellData = resultCellsDataX[y];

                        var calories = resultCellData.calories;
                        if (calories <= 0.0)
                            resultCellData.fireAmount = 0.0;

                        var maxCalories = internalCellData.maxCalories;

                        var spreadFire
                            = calcSpreadFire(0.35, -windDirX - windDirY, x - 1, y - 1, even)
                            + calcSpreadFire(0.5,  -windDirY,            x,     y - 1, even)
                            + calcSpreadFire(0.35,  windDirX - windDirY, x + 1, y - 1, even)
                            + calcSpreadFire(0.5,   windDirX,            x + 1, y,     even)
                            + calcSpreadFire(0.35,  windDirX + windDirY, x + 1, y + 1, even)
                            + calcSpreadFire(0.5,   windDirY,            x,     y + 1, even)
                            + calcSpreadFire(0.35, -windDirX + windDirY, x - 1, y + 1, even)
                            + calcSpreadFire(0.5,  -windDirX,            x - 1, y,     even);
                        var spreadFirefighters
                            = calcSpreadFirefighters(0.175, x - 1, y - 1, even)
                            + calcSpreadFirefighters(0.25,  x,     y - 1, even)
                            + calcSpreadFirefighters(0.175, x + 1, y - 1, even)
                            + calcSpreadFirefighters(0.25,  x + 1, y,     even)
                            + calcSpreadFirefighters(0.175, x + 1, y + 1, even)
                            + calcSpreadFirefighters(0.25,  x,     y + 1, even)
                            + calcSpreadFirefighters(0.175, x - 1, y + 1, even)
                            + calcSpreadFirefighters(0.25,  x - 1, y,     even);

                        var firefightersAmount = resultCellData.firefightersAmount;
                        firefightersAmount += firefightersAmount / 5.0 + spreadFirefighters / 2.0;
                        if (firefightersAmount > FIREFIGHTER_AMOUNT_LIMIT)
                            firefightersAmount = FIREFIGHTER_AMOUNT_LIMIT;

                        var fireAmount = resultCellData.fireAmount;
                        if (calories > maxCalories / 2.0) {
                            fireAmount += maxCalories / 156.0 * (fireAmount / 5.0 + spreadFire / 2.0);
                        } else {
                            fireAmount -= calories / 256.0;
                        }

                        if (fireAmount > (maxCalories + 250.0) / 2.0)
                            fireAmount = (maxCalories + 250.0) / 2.0;

                        if (fireAmount <= firefightersAmount) {
                            fireAmount = 0.0;
                        } else {
                            fireAmount -= firefightersAmount;
                        }

                        if ((fireAmount > 0 || firefightersAmount > 0) &&
                            !(fireAmount <= 0 && firefightersAmount >= FIREFIGHTER_AMOUNT_LIMIT)) {
                            stillActive = true;
                            propagateToNeighborBlocks(newActiveBlocks, x, y);

                            calories -= fireAmount * 0.001;
                            if (calories <= 0) {
                                fireAmount = 0.0;
                                calories = 0.0;
                            }
                        }

                        resultCellData.calories = calories;
                        setFireAmount(resultCellData, fireAmount);
                        resultCellData.firefightersAmount = firefightersAmount;

                        if (even) {
                            internalCellData.fireAmountOdd = fireAmount;
                            internalCellData.firefightersAmountOdd = firefightersAmount;
                        } else {
                            internalCellData.fireAmountEven = fireAmount;
                            internalCellData.firefightersAmountEven = firefightersAmount;
                        }
                    }
                }

                if (!stillActive)
                    delete newActiveBlocks[block.hash];
            }

            activeBlocks = newActiveBlocks;
        }

        function calcSpreadFire(amount, wind, x, y, even) {
            if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight)
                return 0.0;

            var fireAmount;
            if (even)
                fireAmount = internalCellsData[x][y].fireAmountEven;
            else
                fireAmount = internalCellsData[x][y].fireAmountOdd;

            if (fireAmount <= 2)
                return 0.0;

            return Math.abs(fireAmount * amount * (1.0 + wind));
        }

        function calcSpreadFirefighters(amount, x, y, even) {
            if (x < 0 || y < 0 || x >= mapWidth || y >= mapHeight)
                return 0.0;

            var firefightersAmount;
            if (even)
                firefightersAmount = internalCellsData[x][y].firefightersAmountEven;
            else
                firefightersAmount = internalCellsData[x][y].firefightersAmountOdd;

            if (firefightersAmount <= 2)
                return 0.0;

            return firefightersAmount * amount;
        }

        function Point(x, y) {
            this.x = x << 0;
            this.y = y << 0;
            this.hash = 71 * (497 + this.x) + this.y;
        }

        function setFireAmount(rcd, v) {
            rcd.fireAmount = v;
            if (rcd.fireAmount > rcd.maxFireAmount)
                rcd.maxFireAmount = rcd.fireAmount;
        }

        return start();
    }
}})();
