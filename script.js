var autosaveStarted = false
//Sets all variables to their base values
function reset() {
	game = {
        // [id,lifetime,X,Y,moving,angle,moving cooldown,jumping,gender]
        dragons: [
            [1,172800,Math.random() * (window.innerWidth-192),Math.random() * (window.innerHeight-192),false,0,2,0,0],
            [2,172800,Math.random() * (window.innerWidth-192),Math.random() * (window.innerHeight-192),false,0,2,0,1],
            [3,172800,Math.random() * (window.innerWidth-192),Math.random() * (window.innerHeight-192),false,0,2,0,2],
        ],
        dragonsUnlocked: [true,true,true,true],
        dragonMax: 50,
        spawnWildDragons: true,
        unlocks: 0,
        score: 0,
        scorePerSecond: 6,
        bonusScores: [],
        superBonusScores: [],
        noOfBasicDragons: 3,
        eggCooldowns: [0,0,0,0,0],
        eventLog: [],
        selectedBreedingDragons: [-1, -1],
        incubatingDragon: -1,
        incubationTime: 0,
        incubationSkips: 0,
        gunk: 0,
        gunkPerSecond: 0,
        decorationsOwned: [0,0,0,0,0,0,0,0,0,0,0,0],
        totalDecorationsOwned: [0,0,0,0,0,0,0,0,0,0,0,0],
        // [decoration id,X,Y]
        placedDecorations: [],
        dailyRolls: 3,
        dailyRollCooldown: 0,
        nextRollItems: [0,0,0],

        timeOfLastUpdate: Date.now(),
        timeOfLastLargeUpdate: Date.now(),
    }
    viewingEggInfo = 0
    currentInfo = -1
    currentCrateInfo = -1
    currentTip = 1
    currentBreedingSelection = 0
    dailyRollActive = false
    dailyRollVelocity = 0
    dailyRollXPos = 0
}
reset()

//If the user confirms the hard reset, resets all variables, saves and refreshes the page
function hardReset() {
  if (confirm("Are you sure you want to reset? You will lose everything!")) {
    reset()
    save()
    location.reload()
  }
}

function save() {
  game.lastSave = Date.now();
  localStorage.setItem("dodecaParkSave", JSON.stringify(game));
}

function setAutoSave() {
  setInterval(save, 5000);
  autosaveStarted = true;
}
//setInterval(save, 5000)

function load() {
	reset()
	let loadgame = JSON.parse(localStorage.getItem("dodecaParkSave"))
	if (loadgame != null) {loadGame(loadgame)}
}

load()

function exportGame() {
  save()
  navigator.clipboard.writeText(btoa(JSON.stringify(game))).then(function() {
    alert("Copied to clipboard!")
  }, function() {
    alert("Error copying to clipboard, try again...")
  });
}

function importGame() {
  loadgame = JSON.parse(atob(prompt("Input your save here:")))
  if (loadgame && loadgame != null && loadgame != "") {
    reset()
    loadGame(loadgame)
    save()
    location.reload()
  }
  else {
    alert("Invalid input.")
  }
}

function loadGame(loadgame) {
    //Sets each variable in 'game' to the equivalent variable in 'loadgame' (the saved file)
    let loadKeys = Object.keys(loadgame);
    for (let i=0; i<loadKeys.length; i++) {
        if (loadgame[loadKeys[i]] != "undefined") {
            let thisKey = loadKeys[i];
            if (Array.isArray(loadgame[thisKey])) { //Check if the current variable is an array
                for (let j = 0; j < loadgame[thisKey].length; j++) game[thisKey][j] = loadgame[thisKey][j];
            }
            else {game[loadKeys[i]] = loadgame[loadKeys[i]];}
        }
    }

    //Fix score issue
    if (game.timeOfLastUpdate < 1710379895790 && game.score > 2e8) game.score = 1e6

    //Remove starting dragons
    for (let i=0; i<3; i++) document.getElementsByClassName("dragon")[0].remove()
    //Add dragons from the save
    for (let i=0; i<game.dragons.length; i++) {
        let newDragon = document.createElement("div")
        newDragon.className = "dragon"
        newDragon.onclick = function() {displayInfo(1,i)}
        newDragon.style.left = game.dragons[i][2] + "px"
        newDragon.style.top = game.dragons[i][3] + "px"
        newDragon.style.backgroundImage = "url('img/dragon" + game.dragons[i][0] + ".gif')"
        newDragon.style.transform = "scaleX(1)"
        document.getElementById("game").appendChild(newDragon)
    }
    document.getElementById("dragonAmount").innerText = "Dragons: " + game.dragons.length + "/" + game.dragonMax

    //Recalculate the number of basic dragons
    game.noOfBasicDragons = 0
    for (let i=0; i<game.dragons.length; i++) {
        if (game.dragons[i][0] <= 3 || game.dragons[i][0] == 14) game.noOfBasicDragons++
    }

    //Add bonus score icons from the save
    for (let i=0; i<game.bonusScores.length; i++) {
        let newBonusScore = document.createElement("div")
        newBonusScore.className = "bonusScore"
        newBonusScore.style.left = (game.dragons[game.bonusScores[i]][2]+64) + "px"
        newBonusScore.style.top = (game.dragons[game.bonusScores[i]][3]-48) + "px"
        newBonusScore.onclick = function() {collectBonusScore(i)}
        document.getElementById("game").appendChild(newBonusScore)
    }

    //Add super bonus score icons from the save
    for (let i=0; i<game.superBonusScores.length; i++) {
        let newSuperBonusScore = document.createElement("div")
        newSuperBonusScore.className = "superBonusScore"
        newSuperBonusScore.style.left = (game.dragons[game.superBonusScores[i]][2]+64) + "px"
        newSuperBonusScore.style.top = (game.dragons[game.superBonusScores[i]][3]-48) + "px"
        newSuperBonusScore.onclick = function() {collectSuperBonusScore(i)}
        document.getElementById("game").appendChild(newSuperBonusScore)
    }

    //Update egg visuals
    if (game.eggCooldowns[0] > 0) document.getElementById("basicEgg").style.filter = "brightness(0.5)"
    else document.getElementById("basicEgg").style.filter = "none"

    //Score unlocks
    if (game.unlocks >= 1) {
        document.getElementById("breedingButton").style.display = "block"
        document.getElementById("nextUnlock").innerText = "Glowing egg will unlock at 250,000 score!"
    }
    if (game.unlocks >= 2) {
        document.getElementById("glowingEgg").style.display = "block"
        document.getElementById("nextUnlock").innerText = "Daily roll and decorations will unlock at 500,000 score!"
        if (game.eggCooldowns[1] > 0) document.getElementById("glowingEgg").style.filter = "brightness(0.5)"
        else document.getElementById("glowingEgg").style.filter = "none"
    }
    if (game.unlocks >= 3) {
        document.getElementById("dailyRollButton").style.display = "block"
        document.getElementById("decorationsButton").style.display = "block"
        document.getElementById("decorationCrate").style.display = "block"
        document.getElementById("nextUnlock").innerText = "Power egg will unlock at 1,000,000 score!"
        if (game.eggCooldowns[2] > 0) document.getElementById("decorationCrate").style.filter = "brightness(0.5)"
        else document.getElementById("decorationCrate").style.filter = "none"
    }
    if (game.unlocks >= 4) {
        document.getElementById("powerEgg").style.display = "block"
        document.getElementById("nextUnlock").innerText = "Gemstone egg will unlock at 5,000,000 score!"
        if (game.eggCooldowns[3] > 0) document.getElementById("powerEgg").style.filter = "brightness(0.5)"
        else document.getElementById("powerEgg").style.filter = "none"
    }
    if (game.unlocks >= 5) {
        document.getElementById("gemstoneEgg").style.display = "block"
        document.getElementById("nextUnlock").innerText = ""
        if (game.eggCooldowns[4] > 0) document.getElementById("gemstoneEgg").style.filter = "brightness(0.5)"
        else document.getElementById("gemstoneEgg").style.filter = "none"
    }

    //Dragon incubation
    if (game.incubatingDragon > -1) {
        document.getElementById("incubationTab").style.display = "block"
        document.getElementById("breedButton").style.display = "none"
        document.getElementById("incubationImage").src = "img/dragon" + game.incubatingDragon + "-1.png"
        document.getElementById("incubationTitle").innerText = "Incubating " + dragonNames[game.incubatingDragon]
        document.getElementById("incubationTime").innerText = "Time left: " + numberToTime(game.incubationTime)
    }
    else {
        document.getElementById("incubationTab").style.display = "none"
        document.getElementById("breedButton").style.display = "block"
    }

    //Add decorations from the save
    for (let i=0; i<game.placedDecorations.length; i++) {
        let newDecoration = document.createElement("img")
        newDecoration.className = "placedDecoration"
        newDecoration.src = "img/decoration" + (game.placedDecorations[i][0]+1) + ".png"
        newDecoration.style.left = game.placedDecorations[i][1] + "px"
        newDecoration.style.top = game.placedDecorations[i][2] + "px"
        newDecoration.onclick = function() {displayInfo(5,i)}
        document.getElementById("game").appendChild(newDecoration)
    }

    //Daily roll
    if (game.nextRollItems[0] == 0) {
        game.nextRollItems[0] = Math.ceil(game.scorePerSecond * (Math.random()*0.2+0.9)) * 500
        game.nextRollItems[1] = dailyRollDragons[Math.floor(Math.random()*dailyRollDragons.length)]
        game.nextRollItems[2] = Math.ceil(Math.random()*12)
        document.getElementsByClassName("dailyRollIcon")[0].innerHTML = "<p id='dailyRollScore'>+" + format(game.nextRollItems[0]) + "<br>score</p>"
        document.getElementsByClassName("dailyRollIcon")[1].style.backgroundImage = "url('img/dragon" + game.nextRollItems[1] + "-1.png')"
        document.getElementsByClassName("dailyRollIcon")[2].style.backgroundImage = "url('img/decoration" + game.nextRollItems[2] + ".png')"
    }
}

//Number formatting
function format(x,y=0) {
	if (x >= 1000) {
		return Math.floor(x).toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
	}
	else {
		let highestPrecision = 2-Math.floor(Math.log10(x))
		return x.toFixed(Math.min(y, highestPrecision))
	}
}

function numberToTime(x) {
    if (x==0) return "0s"
    xCeil = Math.ceil(x)
    result = ""
    if (xCeil>=3600) result += Math.floor(xCeil/3600) + "h "
    if (Math.floor(xCeil/60)%60 != 0) result += (Math.floor(xCeil/60)%60) + "m "
    if (xCeil%60 != 0) result += Math.floor(xCeil%60) + "s "
    return result
}

let dragonImages = document.getElementsByClassName("dragon")
function updateVisuals() {
    let timeMultiplier = Math.max(Date.now() - game.timeOfLastUpdate, 1) / 1000
    game.score += game.scorePerSecond * timeMultiplier
    game.gunk += game.gunkPerSecond * timeMultiplier
    if (game.gunkPerSecond > 0 && document.getElementById("resources").style.display != "block") document.getElementById("resources").style.display = "block"
    if (game.gunkPerSecond == 0 && document.getElementById("resources").style.display == "block")document.getElementById("resources").style.display = "none"
    if (game.gunkPerSecond > 0) document.getElementById("gunk").innerText = format(game.gunk)
    document.getElementById("score").innerText = format(Math.floor(game.score),0)
    document.getElementById("scorePerSecond").innerText = "score/second: " + format(game.scorePerSecond,1)
    for (i=0; i<game.dragons.length; i++) {
        let jumpHeight = Math.sin(game.dragons[i][7]*Math.PI) * 40
        game.dragons[i][6] -= 1/60
        if (game.dragons[i][6] < 0) game.dragons[i][6] = 0
        //Randomly stop the dragon
        if (game.dragons[i][4] && Math.random() < 0.02 && game.dragons[i][6] <= 0 && game.dragons[i][7] == 0) {
            game.dragons[i][4] = false
            game.dragons[i][6] = 2
            dragonImages[i].style.backgroundImage = "url('img/dragon" + game.dragons[i][0] + ".gif')"
        }
        //Randomly start the dragon
        else if (Math.random() < 0.01 && game.dragons[i][6] <= 0) {
            game.dragons[i][4] = true
            //Pick a random direction
            game.dragons[i][5] = Math.random() * 2 * Math.PI
            game.dragons[i][6] = 2
            dragonImages[i].style.backgroundImage = "url('img/dragon" + game.dragons[i][0] + "walk.gif')"
        }
        //Handle jumping
        if (game.dragons[i][7] > 0) {
            game.dragons[i][7] -= timeMultiplier
            dragonImages[i].style.top = (game.dragons[i][3] - jumpHeight) + "px"
        }
        if (game.dragons[i][7] < 0) game.dragons[i][7] = 0
        if (Math.random() < 0.002 && !game.dragons[i][4] && game.dragons[i][7] == 0) game.dragons[i][7] = 1
        //Calculate boundraies
        if (game.dragons[i][2] < 0) {
            game.dragons[i][2] = 0
            dragonImages[i].style.left = (game.dragons[i][2]) + "px"
            if (game.dragons[i][4] && game.dragons[i][5] > Math.PI/2 && game.dragons[i][5] < Math.PI*3/2) game.dragons[i][5] = Math.PI - game.dragons[i][5]
        }
        if (game.dragons[i][2] > window.innerWidth - 192) {
            game.dragons[i][2] = window.innerWidth - 192
            dragonImages[i].style.left = (game.dragons[i][2]) + "px"
            if (game.dragons[i][4] && game.dragons[i][5] < Math.PI/2 || game.dragons[i][5] > Math.PI*3/2)  game.dragons[i][5] = Math.PI - game.dragons[i][5]
        }
        if (game.dragons[i][3] < 0) {
            game.dragons[i][3] = 0
            dragonImages[i].style.top = (game.dragons[i][3] - jumpHeight) + "px"
            if (game.dragons[i][4] && game.dragons[i][5] > Math.PI)game.dragons[i][5] = -game.dragons[i][5]
        }
        if (game.dragons[i][3] > window.innerHeight - 192) {
            game.dragons[i][3] = window.innerHeight - 192
            dragonImages[i].style.top = (game.dragons[i][3] - jumpHeight) + "px"
            if (game.dragons[i][4] && game.dragons[i][5] < Math.PI) game.dragons[i][5] = -game.dragons[i][5]
        }
        if (game.dragons[i][4]) {
            //Calculate the X and Y speeds
            let Xspeed=0
            let Yspeed=0
            if (game.dragons[i][0] == 13) {
                Xspeed = Math.cos(game.dragons[i][5]) * 20
                Yspeed = Math.sin(game.dragons[i][5]) * 20
            }
            else if (game.dragons[i][0] == 26) {
                Xspeed = Math.cos(game.dragons[i][5]) * 1.5
                Yspeed = Math.sin(game.dragons[i][5]) * 1.5
            }
            else {
                Xspeed = Math.cos(game.dragons[i][5]) * 3
                Yspeed = Math.sin(game.dragons[i][5]) * 3
            }
            game.dragons[i][2] += Xspeed
            game.dragons[i][3] += Yspeed
            if (game.dragons[i][5] < 0) game.dragons[i][5] += Math.PI*2
            if (game.dragons[i][5] > Math.PI*2) game.dragons[i][5] -= Math.PI*2

            //Update visuals
            dragonImages[i].style.left = (game.dragons[i][2]) + "px"
            dragonImages[i].style.top = (game.dragons[i][3] - jumpHeight) + "px"
            dragonImages[i].style.transform = (game.dragons[i][5] > Math.PI/2 && game.dragons[i][5] < Math.PI*3/2) ? "scaleX(-1)" : "scaleX(1)"
            dragonImages[i].style.zIndex = Math.floor(game.dragons[i][3])
        }
    }

    //Update the dragon selection icon
    //Can be made more efficient if need be
    if (currentInfo == -1) {
        document.getElementById("selection").style.display = "none"
    }
    else {
        if (document.getElementById("selection").style.display != "block") document.getElementById("selection").style.display = "block"
        document.getElementById("selection").style.left = game.dragons[currentInfo][2] + "px"
        document.getElementById("selection").style.top = game.dragons[currentInfo][3] + "px"
    }

    //Update the bonus score icons
    for (i=0; i<game.bonusScores.length; i++) {
        document.getElementsByClassName("bonusScore")[i].style.left = (game.dragons[game.bonusScores[i]][2]+64) + "px"
        document.getElementsByClassName("bonusScore")[i].style.top = (game.dragons[game.bonusScores[i]][3]-48) + "px"
    }
    for (i=0; i<game.superBonusScores.length; i++) {
        document.getElementsByClassName("superBonusScore")[i].style.left = (game.dragons[game.superBonusScores[i]][2]+64) + "px"
        document.getElementsByClassName("superBonusScore")[i].style.top = (game.dragons[game.superBonusScores[i]][3]-48) + "px"
    }

    //Update the bonus score text time left
    let bonusScoreTexts = document.getElementsByClassName("bonusScoreText")
    for (i=0; i<bonusScoreTexts.length; i++) {
        bonusScoreTexts[i].dataset.timeLeft -= timeMultiplier
        bonusScoreTexts[i].style.opacity = bonusScoreTexts[i].dataset.timeLeft * 3
        if (bonusScoreTexts[i].dataset.timeLeft <= 0) {bonusScoreTexts[i].remove(); i--}
    }

    //Update the egg visuals
    if (game.eggCooldowns[0] == 0) {document.getElementById("basicEgg").style.transform = "rotate(" + Math.sin(Date.now()/200)*10 + "deg)"}
    else {document.getElementById("basicEgg").style.transform = "none"}
    if (game.unlocks >= 2) {
        if (game.eggCooldowns[1] == 0) {document.getElementById("glowingEgg").style.transform = "rotate(" + Math.sin(Date.now()/200)*10 + "deg)"}
        else {document.getElementById("glowingEgg").style.transform = "none"}
    }
    if (game.unlocks >= 3) {
        if (game.eggCooldowns[2] == 0) {document.getElementById("decorationCrate").style.transform = "rotate(" + Math.sin(Date.now()/200)*10 + "deg)"}
        else {document.getElementById("decorationCrate").style.transform = "none"}
    }
    if (game.unlocks >= 4) {
        if (game.eggCooldowns[3] == 0) {document.getElementById("powerEgg").style.transform = "rotate(" + Math.sin(Date.now()/200)*10 + "deg)"}
        else {document.getElementById("powerEgg").style.transform = "none"}
    }
    if (game.unlocks >= 5) {
        if (game.eggCooldowns[4] == 0) {document.getElementById("gemstoneEgg").style.transform = "rotate(" + Math.sin(Date.now()/200)*10 + "deg)"}
        else {document.getElementById("gemstoneEgg").style.transform = "none"}
    }

    //Update the daily roll bar
    if (dailyRollActive) {
        dailyRollXPos += dailyRollVelocity
        if (dailyRollXPos > 416) dailyRollXPos -= 416
        dailyRollVelocity -= timeMultiplier * 10
        document.getElementById("dailyRollBar").style.left = (dailyRollXPos + 44) + "px"
        if (dailyRollVelocity <= 0) {
            dailyRollVelocity = 0
            dailyRollActive = false
            let rollResult = Math.floor(dailyRollXPos / 104)
            if (rollResult == 0) {
                updateEventLog("You won " + format(game.nextRollItems[0]) + " score from your daily roll!")
                document.getElementById("dailyRollResults").innerText = "You won " + format(game.nextRollItems[0]) + " score!"
                game.score += game.nextRollItems[0]
            }
            else if (rollResult == 1) {
                updateEventLog("You won a " + dragonNames[game.nextRollItems[1]] + " from your daily roll!")
                document.getElementById("dailyRollResults").innerText = "You won a " + dragonNames[game.nextRollItems[1]] + "!"
                createDragon(game.nextRollItems[1])
            }
            else if (rollResult == 2) {
                updateEventLog("You won a " + decorationNames[game.nextRollItems[2]-1] + " from your daily roll!")
                document.getElementById("dailyRollResults").innerText = "You won a " + decorationNames[game.nextRollItems[2]-1] + "!"
                game.decorationsOwned[game.nextRollItems[2]-1]++
                game.totalDecorationsOwned[game.nextRollItems[2]-1]++
            }
            else {
                updateEventLog("You won a free incubation skip from your daily roll!")
                document.getElementById("dailyRollResults").innerText = "You won a free incubation skip!"
                game.incubationSkips++
            }
            game.nextRollItems[0] = Math.ceil(game.scorePerSecond * (Math.random()*0.2+0.9)) * 500
            game.nextRollItems[1] = dailyRollDragons[Math.floor(Math.random()*dailyRollDragons.length)]
            game.nextRollItems[2] = Math.ceil(Math.random()*12)
            document.getElementsByClassName("dailyRollIcon")[0].innerHTML = "<p id='dailyRollScore'>+" + format(game.nextRollItems[0]) + "<br>score</p>"
            document.getElementsByClassName("dailyRollIcon")[1].style.backgroundImage = "url('img/dragon" + game.nextRollItems[1] + "-1.png')"
            document.getElementsByClassName("dailyRollIcon")[2].style.backgroundImage = "url('img/decoration" + game.nextRollItems[2] + ".png')"
        }
    }

    game.timeOfLastUpdate = Date.now()
}

setInterval(updateVisuals, 1000/60)

function updateLarge() {
    let timeMultiplier = Math.max(Date.now() - game.timeOfLastLargeUpdate, 1) / 1000
    if (currentInfo != -1 && game.dragons[currentInfo][0]==25) {document.getElementById("subInfo").innerHTML = genders[game.dragons[currentInfo][8]] + "<br>Producing 1.0 gunk/second"}
    else if (currentInfo != -1) document.getElementById("subInfo").innerHTML = genders[game.dragons[currentInfo][8]] + "<br>Producing " + format(dragonProductions[game.dragons[currentInfo][0]],1) + " score/second"
    //Update the egg cooldowns
    if (game.eggCooldowns[0] > 0) game.eggCooldowns[0] -= timeMultiplier
    if (game.eggCooldowns[0] < 0) game.eggCooldowns[0] = 0
    if (game.eggCooldowns[0] == 0) document.getElementById("basicEgg").style.filter = "none"
    if (game.unlocks >= 2) {
        if (game.eggCooldowns[1] > 0) game.eggCooldowns[1] -= timeMultiplier
        if (game.eggCooldowns[1] < 0) game.eggCooldowns[1] = 0
        if (game.eggCooldowns[1] == 0) document.getElementById("glowingEgg").style.filter = "none"
    }
    if (game.unlocks >= 3) {
        if (game.eggCooldowns[2] > 0) game.eggCooldowns[2] -= timeMultiplier
        if (game.eggCooldowns[2] < 0) game.eggCooldowns[2] = 0
        if (game.eggCooldowns[2] == 0) document.getElementById("decorationCrate").style.filter = "none"
    }
    if (game.unlocks >= 4) {
        if (game.eggCooldowns[3] > 0) game.eggCooldowns[3] -= timeMultiplier
        if (game.eggCooldowns[3] < 0) game.eggCooldowns[3] = 0
        if (game.eggCooldowns[3] == 0) document.getElementById("powerEgg").style.filter = "none"
    }
    if (game.unlocks >= 5) {
        if (game.eggCooldowns[4] > 0) game.eggCooldowns[4] -= timeMultiplier
        if (game.eggCooldowns[4] < 0) game.eggCooldowns[4] = 0
        if (game.eggCooldowns[4] == 0) document.getElementById("gemstoneEgg").style.filter = "none"
    }
    if (viewingEggInfo > 0 && viewingEggInfo < 4) {document.getElementById("subInfo").innerText = "Time left: " + numberToTime(game.eggCooldowns[viewingEggInfo-1])}
    else if (viewingEggInfo > 4) {document.getElementById("subInfo").innerText = "Time left: " + numberToTime(game.eggCooldowns[viewingEggInfo-2])}
    //Score unlocks
    if (game.score >= 100000 && game.unlocks < 1) {
        game.unlocks = 1
        document.getElementById("breedingButton").style.display = "block"
        document.getElementById("nextUnlock").innerText = "Glowing egg will unlock at 250,000 score!"
        openTips()
        currentTip = 4
        displayTip(currentTip)
    }
    if (game.score >= 250000 && game.unlocks < 2) {
        game.unlocks = 2
        document.getElementById("glowingEgg").style.display = "block"
        document.getElementById("nextUnlock").innerText = "Daily roll and decorations will unlock at 500,000 score!"
    }
    if (game.score >= 500000 && game.unlocks < 3) {
        game.unlocks = 3
        document.getElementById("dailyRollButton").style.display = "block"
        document.getElementById("decorationsButton").style.display = "block"
        document.getElementById("decorationCrate").style.display = "block"
        document.getElementById("nextUnlock").innerText = "Power egg will unlock at 1,000,000 score!"
    }
    if (game.score >= 1000000 && game.unlocks < 4) {
        game.unlocks = 4
        document.getElementById("powerEgg").style.display = "block"
        document.getElementById("nextUnlock").innerText = "Gemstone egg will unlock at 5,000,000 score!"
    }
    if (game.score >= 5000000 && game.unlocks < 5) {
        game.unlocks = 5
        document.getElementById("gemstoneEgg").style.display = "block"
        document.getElementById("nextUnlock").innerText = ""
    }
    //Dragon incubation
    if (game.incubatingDragon > -1) {
        if (game.incubationTime <= 1 && game.dragons.length >= game.dragonMax) {
            game.incubationTime = 1
            document.getElementById("incubationTime").innerText = "Time left: " + numberToTime(game.incubationTime) + " (Waiting for space to hatch)"
        }
        else {
            game.incubationTime -= timeMultiplier
            document.getElementById("incubationTime").innerText = "Time left: " + numberToTime(game.incubationTime)
        }
        if (game.dragons.length < game.dragonMax) {
            if (game.incubationTime <= 0) {
                game.incubationTime = 0
                createDragon(game.incubatingDragon)
                updateEventLog("Your " + dragonNames[game.incubatingDragon] + " has hatched!")
                game.incubatingDragon = -1
                document.getElementById("incubationTab").style.display = "none"
                document.getElementById("breedButton").style.display = "block"
            }
        }
    }
    //Daily roll cooldown
    if (game.dailyRollCooldown > 0) {
        game.dailyRollCooldown -= timeMultiplier
        document.getElementById("dailyRollsLeft").innerHTML = "<b>You have " + game.dailyRolls + " rolls left</b><br>Time until more rolls: " + numberToTime(game.dailyRollCooldown)
        if (game.dailyRollCooldown <= 0) {
            game.dailyRollCooldown = 0
            game.dailyRolls = 3
            document.getElementById("dailyRollsLeft").innerHTML = "<b>You have " + game.dailyRolls + " rolls left</b>"
        }
    }

    game.timeOfLastLargeUpdate = Date.now()
}
setInterval(updateLarge, 1000)

//Bonus score stuff
function createBonusScoreIcon() {
    if (game.bonusScores.length >= 3) return
    let randomDragon = Math.floor(Math.random() * game.dragons.length)
    while (game.bonusScores.includes(randomDragon) || game.superBonusScores.includes(randomDragon)) randomDragon = Math.floor(Math.random() * game.dragons.length)
    let newBonusScore = document.createElement("div")
    newBonusScore.className = "bonusScore"
    newBonusScore.style.left = (game.dragons[randomDragon][2]+64) + "px"
    newBonusScore.style.top = (game.dragons[randomDragon][3]-48) + "px"
    let bonusScoreNumber = game.bonusScores.length
    newBonusScore.onclick = function() {collectBonusScore(bonusScoreNumber)}
    document.getElementById("game").appendChild(newBonusScore)
    game.bonusScores.push(randomDragon)
}

setInterval(createBonusScoreIcon, Math.random() * 60000 + 60000)

function collectBonusScore(x) {
    let bonusScore = Math.ceil(game.scorePerSecond * dragonProductions[game.dragons[game.bonusScores[x]][0]] / 10) * 100
    game.score += bonusScore
    let bonusScoreText = document.createElement("p")
    bonusScoreText.className = "bonusScoreText"
    bonusScoreText.innerText = "+" + format(bonusScore)
    bonusScoreText.style.left = game.dragons[game.bonusScores[x]][2] + "px"
    bonusScoreText.style.top = (game.dragons[game.bonusScores[x]][3]-32) + "px"
    bonusScoreText.dataset.timeLeft = 1
    document.getElementById("game").appendChild(bonusScoreText)
    updateEventLog("You gained " + format(bonusScore) + " bonus score!")
    game.bonusScores.splice(x,1)
    document.getElementsByClassName("bonusScore")[x].remove()
    //Update bonus score onclicks
    for (let i=0; i<game.bonusScores.length; i++) {
        document.getElementsByClassName("bonusScore")[i].onclick = function() {collectBonusScore(i)}
    }
}

//Super bonus score stuff
function createSuperBonusScoreIcon() {
    if (game.superBonusScores.length >= 1) return
    let randomDragon = Math.floor(Math.random() * game.dragons.length)
    while (game.bonusScores.includes(randomDragon) || game.superBonusScores.includes(randomDragon)) randomDragon = Math.floor(Math.random() * game.dragons.length)
    let newSuperBonusScore = document.createElement("div")
    newSuperBonusScore.className = "superBonusScore"
    newSuperBonusScore.style.left = (game.dragons[randomDragon][2]+64) + "px"
    newSuperBonusScore.style.top = (game.dragons[randomDragon][3]-48) + "px"
    let superbonusScoreNumber = game.superBonusScores.length
    newSuperBonusScore.onclick = function() {collectSuperBonusScore(superbonusScoreNumber)}
    document.getElementById("game").appendChild(newSuperBonusScore)
    game.superBonusScores.push(randomDragon)
}

setInterval(createSuperBonusScoreIcon, Math.random() * 600000 + 900000)

function collectSuperBonusScore(x) {
    let superBonusScore = Math.ceil(game.scorePerSecond * dragonProductions[game.dragons[game.superBonusScores[x]][0]] / 10) * 500
    game.score += superBonusScore
    let bonusScoreText = document.createElement("p")
    bonusScoreText.className = "bonusScoreText"
    bonusScoreText.innerText = "+" + format(superBonusScore)
    bonusScoreText.style.left = game.dragons[game.superBonusScores[x]][2] + "px"
    bonusScoreText.style.top = (game.dragons[game.superBonusScores[x]][3]-32) + "px"
    bonusScoreText.dataset.timeLeft = 1
    document.getElementById("game").appendChild(bonusScoreText)
    updateEventLog("You gained " + format(superBonusScore) + " super bonus score!")
    game.superBonusScores.splice(x,1)
    document.getElementsByClassName("superBonusScore")[x].remove()
    //Update bonus score onclicks
    for (let i=0; i<game.superBonusScores.length; i++) {
        document.getElementsByClassName("superBonusScore")[i].onclick = function() {collectBonusScore(i)}
    }
}

//Initial visual update
for (i=0; i<game.dragons.length; i++) {
    let jumpHeight = Math.sin(game.dragons[i][7]*Math.PI) * 40
    dragonImages[i].style.left = (game.dragons[i][2]) + "px"
    dragonImages[i].style.top = (game.dragons[i][3] - jumpHeight) + "px"
    dragonImages[i].style.transform = (game.dragons[i][5] > Math.PI/2 && game.dragons[i][5] < Math.PI*3/2) ? "scaleX(-1)" : "scaleX(1)"
    dragonImages[i].style.zIndex = Math.floor(game.dragons[i][3])
    if (game.dragons[i][4]) {
        document.getElementsByClassName("dragon")[i].style.backgroundImage = "url('img/dragon" + game.dragons[i][0] + "walk.gif')"
    }
}

function displayInfo(x,y) {
    //Hide the tab
    if (x==0) {
        document.getElementById("infoTab").style.display = "none"
        currentInfo = -1
        currentCrateInfo = -1
        viewingEggInfo = 0
    }
    //Dragon info
    else if (x==1 && currentInfo == y) {
        document.getElementById("infoTab").style.display = "none"
        currentInfo = -1
        currentCrateInfo = -1
    }
    else if (x==1) {
        document.getElementById("infoTab").style.display = "block"
        document.getElementById("info").innerText = dragonNames[game.dragons[y][0]]
        if (game.dragons[y][0]==25) {document.getElementById("subInfo").innerHTML = genders[game.dragons[y][8]] + "<br>Producing 1.0 gunk/second"}
        else {document.getElementById("subInfo").innerHTML = genders[game.dragons[y][8]] + "<br>Producing " + format(dragonProductions[game.dragons[y][0]],1) + " score/second"}
        document.getElementById("infoImage").src = "img/dragon" + game.dragons[y][0] + ".gif"
        document.getElementById("infoImage").style.width = "96px"
        document.getElementById("eggRarities").style.display = "none"
        document.getElementById("sendAwayButton").style.display = "block"
        document.getElementById("removeDecorationButton").style.display = "none"
        currentInfo = y
        currentCrateInfo = -1
    }
    //Basic info
    else if (x>1 && x!=5 && y==0) {
        document.getElementById("infoTab").style.display = "none"
        viewingEggInfo = 0
    }
    else if (x==2 && y==1) {
        currentInfo = -1
        currentCrateInfo = -1
        viewingEggInfo = 1
        document.getElementById("infoTab").style.display = "block"
        document.getElementById("info").innerText = "Basic egg"
        document.getElementById("subInfo").innerText = "Time left: " + numberToTime(game.eggCooldowns[0])
        document.getElementById("infoImage").src = "img/egg1.png"
        document.getElementById("infoImage").style.width = "64px"
        document.getElementById("eggRarities").style.display = "block"
        document.getElementById("eggRarities").innerHTML = "<b>Rarities:</b>"
        document.getElementById("sendAwayButton").style.display = "none"
        document.getElementById("removeDecorationButton").style.display = "none"
        let totalRarity = 0
        for (i=0; i<basicEggRarities.length; i++) {
            totalRarity += basicEggRarities[i][1]
        }
        for (i=0; i<basicEggRarities.length; i++) {
            if (game.dragonsUnlocked[basicEggRarities[i][0]]) {document.getElementById("eggRarities").innerHTML += "<br><img style='vertical-align: middle' src='img/dragon" + basicEggRarities[i][0] + "-1.png'>" + dragonNames[basicEggRarities[i][0]]}
            else {document.getElementById("eggRarities").innerHTML += "<br><img style='vertical-align: middle' src='img/unknownDragon.png'>???"}
            document.getElementById("eggRarities").innerHTML += ": " + format(basicEggRarities[i][1]/totalRarity*100,1) + "%"
        }
    }
    //Glowing egg info
    else if (x==3 && y==1) {
        currentInfo = -1
        currentCrateInfo = -1
        viewingEggInfo = 2
        document.getElementById("infoTab").style.display = "block"
        document.getElementById("info").innerText = "Glowing egg"
        document.getElementById("subInfo").innerText = "Time left: " + numberToTime(game.eggCooldowns[1])
        document.getElementById("infoImage").src = "img/egg2.png"
        document.getElementById("infoImage").style.width = "64px"
        document.getElementById("eggRarities").style.display = "block"
        document.getElementById("eggRarities").innerHTML = "<b>Rarities:</b>"
        document.getElementById("sendAwayButton").style.display = "none"
        document.getElementById("removeDecorationButton").style.display = "none"
        let totalRarity = 0
        for (i=0; i<glowingEggRarities.length; i++) {
            totalRarity += glowingEggRarities[i][1]
        }
        for (i=0; i<glowingEggRarities.length; i++) {
            if (game.dragonsUnlocked[glowingEggRarities[i][0]]) {document.getElementById("eggRarities").innerHTML += "<br><img style='vertical-align: middle' src='img/dragon" + glowingEggRarities[i][0] + "-1.png'>" + dragonNames[glowingEggRarities[i][0]]}
            else {document.getElementById("eggRarities").innerHTML += "<br><img style='vertical-align: middle' src='img/unknownDragon.png'>???"}
            document.getElementById("eggRarities").innerHTML += ": " + format(glowingEggRarities[i][1]/totalRarity*100,1) + "%"
        }
    }
    //Decoration crate info
    else if (x==4 && y==1) {
        currentInfo = -1
        currentCrateInfo = -1
        viewingEggInfo = 3
        document.getElementById("infoTab").style.display = "block"
        document.getElementById("info").innerText = "Decoration crate"
        document.getElementById("subInfo").innerText = "Time left: " + numberToTime(game.eggCooldowns[2])
        document.getElementById("infoImage").src = "img/crate.png"
        document.getElementById("infoImage").style.width = "64px"
        document.getElementById("eggRarities").style.display = "block"
        document.getElementById("eggRarities").innerHTML = "<b>Rarities:</b>"
        document.getElementById("sendAwayButton").style.display = "none"
        document.getElementById("removeDecorationButton").style.display = "none"
        let totalRarity = 0
        for (i=0; i<decorationCrateRarities.length; i++) {
            totalRarity += decorationCrateRarities[i][1]
        }
        for (i=0; i<decorationCrateRarities.length; i++) {
            document.getElementById("eggRarities").innerHTML += "<br><img style='vertical-align: middle; width: 32px; margin-right: 4px' src='img/decoration" + (decorationCrateRarities[i][0]+1) + ".png'> " + decorationNames[decorationCrateRarities[i][0]]
            document.getElementById("eggRarities").innerHTML += ": " + format(decorationCrateRarities[i][1]/totalRarity*100,1) + "%"
        }
    }
    //Decoration info
    else if (x==5) {
        currentInfo = -1
        currentCrateInfo = y
        viewingEggInfo = 4
        document.getElementById("infoTab").style.display = "block"
        document.getElementById("info").innerText = decorationNames[game.placedDecorations[y][0]]
        document.getElementById("subInfo").innerText = "You own " + game.totalDecorationsOwned[game.placedDecorations[y][0]] + " of this decoration"
        document.getElementById("infoImage").src = "img/decoration" + (game.placedDecorations[y][0]+1) + ".png"
        document.getElementById("infoImage").style.width = "64px"
        document.getElementById("eggRarities").style.display = "none"
        document.getElementById("sendAwayButton").style.display = "none"
        document.getElementById("removeDecorationButton").style.display = "block"
    }
    //Power egg info
    else if (x==6 && y==1) {
        currentInfo = -1
        currentCrateInfo = -1
        viewingEggInfo = 5
        document.getElementById("infoTab").style.display = "block"
        document.getElementById("info").innerText = "Power egg"
        document.getElementById("subInfo").innerText = "Time left: " + numberToTime(game.eggCooldowns[3])
        document.getElementById("infoImage").src = "img/egg3.png"
        document.getElementById("infoImage").style.width = "64px"
        document.getElementById("eggRarities").style.display = "block"
        document.getElementById("eggRarities").innerHTML = "<b>Rarities:</b>"
        document.getElementById("sendAwayButton").style.display = "none"
        document.getElementById("removeDecorationButton").style.display = "none"
        let totalRarity = 0
        for (i=0; i<powerEggRarities.length; i++) {
            totalRarity += powerEggRarities[i][1]
        }
        for (i=0; i<powerEggRarities.length; i++) {
            if (game.dragonsUnlocked[powerEggRarities[i][0]]) {document.getElementById("eggRarities").innerHTML += "<br><img style='vertical-align: middle' src='img/dragon" + powerEggRarities[i][0] + "-1.png'>" + dragonNames[powerEggRarities[i][0]]}
            else {document.getElementById("eggRarities").innerHTML += "<br><img style='vertical-align: middle' src='img/unknownDragon.png'>???"}
            document.getElementById("eggRarities").innerHTML += ": " + format(powerEggRarities[i][1]/totalRarity*100,1) + "%"
        }
    }
    //Gemstone egg info
    else if (x==7 && y==1) {
        currentInfo = -1
        currentCrateInfo = -1
        viewingEggInfo = 6
        document.getElementById("infoTab").style.display = "block"
        document.getElementById("info").innerText = "Gemstone egg"
        document.getElementById("subInfo").innerText = "Time left: " + numberToTime(game.eggCooldowns[4])
        document.getElementById("infoImage").src = "img/egg4.png"
        document.getElementById("infoImage").style.width = "64px"
        document.getElementById("eggRarities").style.display = "block"
        document.getElementById("eggRarities").innerHTML = "<b>Rarities:</b>"
        document.getElementById("sendAwayButton").style.display = "none"
        document.getElementById("removeDecorationButton").style.display = "none"
        let totalRarity = 0
        for (i=0; i<gemstoneEggRarities.length; i++) {
            totalRarity += gemstoneEggRarities[i][1]
        }
        for (i=0; i<gemstoneEggRarities.length; i++) {
            if (game.dragonsUnlocked[gemstoneEggRarities[i][0]]) {document.getElementById("eggRarities").innerHTML += "<br><img style='vertical-align: middle' src='img/dragon" + gemstoneEggRarities[i][0] + "-1.png'>" + dragonNames[gemstoneEggRarities[i][0]]}
            else {document.getElementById("eggRarities").innerHTML += "<br><img style='vertical-align: middle' src='img/unknownDragon.png'>???"}
            document.getElementById("eggRarities").innerHTML += ": " + format(gemstoneEggRarities[i][1]/totalRarity*100,1) + "%"
        }
    }
}

function createDragon(x) {
    game.scorePerSecond += dragonProductions[x]
    if (x == 25) game.gunkPerSecond += 1
    game.dragonsUnlocked[x] = true
    let randomX = Math.random() * (window.innerWidth-192)
    let randomY = Math.random() * (window.innerHeight-192)
    let dragonInfo = [x,172800,randomX,randomY,false,0,2,0,Math.floor(Math.random()*3)]
    //If Mr. Gunky make his gender male
    if (x == 25) dragonInfo[8] = 0
    game.dragons.push(dragonInfo)
    let newDragon = document.createElement("div")
    newDragon.className = "dragon"
    let dragonLength = game.dragons.length-1
    newDragon.onclick = function() {displayInfo(1,dragonLength)}
    newDragon.style.left = randomX + "px"
    newDragon.style.top = randomY + "px"
    newDragon.style.zIndex = Math.floor(randomY)
    newDragon.style.backgroundImage = "url('img/dragon" + x + ".gif')"
    newDragon.style.transform = "scaleX(1)"
    document.getElementById("game").appendChild(newDragon)
    document.getElementById("dragonAmount").innerText = "Dragons: " + game.dragons.length + "/" + game.dragonMax
}

function createAllDebug() {
    for (let i=1; i<dragonNames.length; i++) createDragon(i)

}

function deleteDragon(x) {
    game.scorePerSecond -= dragonProductions[game.dragons[x][0]]
    //Check if the deleted dragon was a basic dragon
    if (game.dragons[x][0] <= 3 || game.dragons[x][0] == 14) game.noOfBasicDragons--
    if (game.dragons[x][0] == 25) game.gunkPerSecond -= 1
    game.dragons.splice(x,1)
    document.getElementsByClassName("dragon")[x].remove()
    for (let i=0;i<game.selectedBreedingDragons.length;i++) {
        if (game.selectedBreedingDragons[i] > x) game.selectedBreedingDragons[i]--
    }
    for (let i=0;i<game.bonusScores.length;i++) {
        if (game.bonusScores[i] > x) game.bonusScores[i]--
    }
    for (let i=0;i<game.superBonusScores.length;i++) {
        if (game.superBonusScores[i] > x) game.superBonusScores[i]--
    }
    //Check if the deleted dragon was in the bonus score selection
    if (game.bonusScores.includes(x)) {
        document.getElementsByClassName("bonusScore")[game.bonusScores.indexOf(x)].remove()
        game.bonusScores.splice(game.bonusScores.indexOf(x),1)
        //Update bonus score onclicks
        for (let i=0; i<game.bonusScores.length; i++) {
            document.getElementsByClassName("bonusScore")[i].onclick = function() {collectBonusScore(i)}
        }
    }
    //Check if the deleted dragon was in the super bonus score selection
    if (game.superBonusScores.includes(x)) {
        document.getElementsByClassName("superBonusScore")[game.superBonusScores.indexOf(x)].remove()
        game.superBonusScores.splice(game.superBonusScores.indexOf(x),1)
        //Update bonus score onclicks
        for (let i=0; i<game.superBonusScores.length; i++) {
            document.getElementsByClassName("superBonusScore")[i].onclick = function() {collectBonusScore(i)}
        }
    }
    //Update the onclick functions
    for (let i=0; i<game.dragons.length; i++) {
        document.getElementsByClassName("dragon")[i].onclick = function() {displayInfo(1,i)}
    }
    //Check if the deleted dragon was in the breeding selection
    if (game.selectedBreedingDragons[0] == x) {
        game.selectedBreedingDragons[0] = -1
        document.getElementsByClassName("selectBreedingDragon")[0].style.backgroundImage = "none"
        document.getElementsByClassName("breedingTitle")[2].innerText = "No dragon selected..."
    }
    if (game.selectedBreedingDragons[1] == x) {
        game.selectedBreedingDragons[1] = -1
        document.getElementsByClassName("selectBreedingDragon")[1].style.backgroundImage = "none"
        document.getElementsByClassName("breedingTitle")[3].innerText = "No dragon selected..."
    }
    document.getElementById("dragonAmount").innerText = "Dragons: " + game.dragons.length + "/" + game.dragonMax
    displayInfo(0)
}

function sendAwayCheck(x) {
    if (confirm("Are you sure you want to send away this dragon? It will be gone forever!")) {updateEventLog("You sent away your " + dragonNames[game.dragons[x][0]] + ""); deleteDragon(x)}
}

function sendAwayListCheck(x) {
    if (confirm("Are you sure you want to send away this dragon? It will be gone forever!")) {updateEventLog("You sent away your " + dragonNames[game.dragons[x][0]] + ""); deleteDragon(x); document.getElementById("dragonListTab").style.display = "none"; openDragonList();}
}

function displayTip(x) {
    document.getElementById("tip").innerText = tips[x-1]
}
displayTip(1)

function createBasicDragon() {
    //Time multiplier so that wild dragons become less common as more spawn
    let spawnTimeMultiplier = ((game.noOfBasicDragons+1) ** 0.6)
    if (game.spawnWildDragons == false || game.dragons.length >= game.dragonMax) {basicDragonTimeout = setTimeout(createBasicDragon, Math.random() * 100000 * spawnTimeMultiplier + 200000 * spawnTimeMultiplier); return}
    let randomDragon = Math.floor(Math.random() * 3) + 1
    //Tiny goat chance
    if (Math.random() < 0.01) randomDragon = 14
    createDragon(randomDragon)
    updateEventLog("A wild " + dragonNames[randomDragon] + " appeared!")
    basicDragonTimeout = setTimeout(createBasicDragon, Math.random() * 100000 * spawnTimeMultiplier + 200000 * spawnTimeMultiplier)
    game.noOfBasicDragons++
}
let spawnTimeMultiplier = ((game.noOfBasicDragons+1) ** 0.6)
basicDragonTimeout = setTimeout(createBasicDragon, Math.random() * 100000 * spawnTimeMultiplier + 200000 * spawnTimeMultiplier)

function openBasicEgg() {
    if (game.eggCooldowns[0] > 0) return
    if (game.dragons.length >= game.dragonMax) {
        alert("You have too many dragons! Send some away to make room for more!")
        return
    }
    let totalRarity = 0
    for (i=0; i<basicEggRarities.length; i++) {
        totalRarity += basicEggRarities[i][1]
    }
    let random = Math.random() * totalRarity
    let raritySum = 0
    for (i=0; i<basicEggRarities.length; i++) {
        raritySum += basicEggRarities[i][1]
        if (random < raritySum) {
            createDragon(basicEggRarities[i][0])
            updateEventLog("You hatched a " + dragonNames[basicEggRarities[i][0]] + "! (from basic egg)")
            break
        }
    }
    game.eggCooldowns[0] = 300
    document.getElementById("basicEgg").style.filter = "brightness(0.5)"
    document.getElementById("basicEgg").style.transform = "none"
}


function openGlowingEgg() {
    if (game.eggCooldowns[1] > 0) return
    if (game.dragons.length >= game.dragonMax) {
        alert("You have too many dragons! Send some away to make room for more!")
        return
    }
    let totalRarity = 0
    for (i=0; i<glowingEggRarities.length; i++) {
        totalRarity += glowingEggRarities[i][1]
    }
    let random = Math.random() * totalRarity
    let raritySum = 0
    for (i=0; i<glowingEggRarities.length; i++) {
        raritySum += glowingEggRarities[i][1]
        if (random < raritySum) {
            createDragon(glowingEggRarities[i][0])
            updateEventLog("You hatched a " + dragonNames[glowingEggRarities[i][0]] + "! (from glowing egg)")
            break
        }
    }
    game.eggCooldowns[1] = 900
    document.getElementById("glowingEgg").style.filter = "brightness(0.5)"
    document.getElementById("glowingEgg").style.transform = "none"
}

function openPowerEgg() {
    if (game.eggCooldowns[3] > 0) return
    if (game.dragons.length >= game.dragonMax) {
        alert("You have too many dragons! Send some away to make room for more!")
        return
    }
    let totalRarity = 0
    for (i=0; i<powerEggRarities.length; i++) {
        totalRarity += powerEggRarities[i][1]
    }
    let random = Math.random() * totalRarity
    let raritySum = 0
    for (i=0; i<powerEggRarities.length; i++) {
        raritySum += powerEggRarities[i][1]
        if (random < raritySum) {
            createDragon(powerEggRarities[i][0])
            updateEventLog("You hatched a " + dragonNames[powerEggRarities[i][0]] + "! (from power egg)")
            break
        }
    }
    game.eggCooldowns[3] = 1800
    document.getElementById("powerEgg").style.filter = "brightness(0.5)"
    document.getElementById("powerEgg").style.transform = "none"
}

function openGemstoneEgg() {
    if (game.eggCooldowns[4] > 0) return
    if (game.dragons.length >= game.dragonMax) {
        alert("You have too many dragons! Send some away to make room for more!")
        return
    }
    let totalRarity = 0
    for (i=0; i<gemstoneEggRarities.length; i++) {
        totalRarity += gemstoneEggRarities[i][1]
    }
    let random = Math.random() * totalRarity
    let raritySum = 0
    for (i=0; i<gemstoneEggRarities.length; i++) {
        raritySum += gemstoneEggRarities[i][1]
        if (random < raritySum) {
            createDragon(gemstoneEggRarities[i][0])
            updateEventLog("You hatched a " + dragonNames[gemstoneEggRarities[i][0]] + "! (from gemstone egg)")
            break
        }
    }
    game.eggCooldowns[4] = 2700
    document.getElementById("gemstoneEgg").style.filter = "brightness(0.5)"
    document.getElementById("gemstoneEgg").style.transform = "none"

}

function openDecorationCrate() {
    if (game.eggCooldowns[2] > 0) return
    let totalRarity = 0
    for (i=0; i<decorationCrateRarities.length; i++) {
        totalRarity += decorationCrateRarities[i][1]
    }
    let random = Math.random() * totalRarity
    let raritySum = 0
    for (i=0; i<decorationCrateRarities.length; i++) {
        raritySum += decorationCrateRarities[i][1]
        if (random < raritySum) {
            game.decorationsOwned[decorationCrateRarities[i][0]]++
            game.totalDecorationsOwned[decorationCrateRarities[i][0]]++
            updateEventLog("You unboxed a " + decorationNames[decorationCrateRarities[i][0]] + "!")
            break
        }
    }
    game.eggCooldowns[2] = 3600
    document.getElementById("decorationCrate").style.filter = "brightness(0.5)"
    document.getElementById("decorationCrate").style.transform = "none"
}

function openBestiary() {
    if (document.getElementById("bestiaryTab").style.display == "block") {document.getElementById("bestiaryTab").style.display = "none"; return}
    if (dailyRollActive) return
    document.getElementById("bestiaryTab").style.display = "block"
    document.getElementById("breedingTab").style.display = "none"
    document.getElementById("dailyRollTab").style.display = "none"
    document.getElementById("decorationsTab").style.display = "none"
    document.getElementById("bestiaryTitle").innerText = "Click a dragon to see info!"
    document.getElementById("bestiaryInfo").innerText = ""
    document.getElementById("bestiary").innerHTML = ""
    //Create the bestiary images
    for (let i=1;i<dragonNames.length;i++) {
        let bestiaryImage = document.createElement("div")
        bestiaryImage.className = "bestiaryImage"
        //Check if the dragon is unlocked
        if (game.dragonsUnlocked[i]) {
            bestiaryImage.style.backgroundImage = "url('img/dragon" + i + "-1.png')"
            bestiaryImage.style.cursor = "pointer"
            bestiaryImage.onclick = function() {displayBestiaryInfo(i)}
        }
        else {
            bestiaryImage.style.backgroundImage = "url('img/unknownDragon.png')"
        }
        document.getElementById("bestiary").appendChild(bestiaryImage)
    }
}

function closeBestiary() {
    document.getElementById("bestiaryTab").style.display = "none"
}

function displayBestiaryInfo(x) {
    document.getElementById("bestiaryTitle").innerText = dragonNames[x]
    document.getElementById("bestiaryInfo").innerHTML = "Bestiary ID: " + x + "<br>"
    if (x == 25) {document.getElementById("bestiaryInfo").innerHTML += "Produces 1.0 gunk/second"}
    else {document.getElementById("bestiaryInfo").innerHTML += "Produces " + format(dragonProductions[x],1) + " score/second"}
}

function openTips() {
    if (document.getElementById("tipTab").style.display == "block") {document.getElementById("tipTab").style.display = "none"; return}
    document.getElementById("eventLogTab").style.display = "none"
    document.getElementById("tipTab").style.display = "block"
    document.getElementById("settingsTab").style.display = "none"
}

function nextTip() {
    if ((currentTip >= 3 && game.unlocks < 1) || currentTip >= 4) return;
    currentTip++
    displayTip(currentTip)
}

function previousTip() {
    if (currentTip < 2) return;
    currentTip--
    displayTip(currentTip)
}

function openSettings() {
    if (document.getElementById("settingsTab").style.display == "block") {document.getElementById("settingsTab").style.display = "none"; return}
    document.getElementById("settingsTab").style.display = "block"
    document.getElementById("eventLogTab").style.display = "none"
    document.getElementById("tipTab").style.display = "none"
    document.getElementById("wildSpawnCheckbox").checked = game.spawnWildDragons
}

function toggleSpawnWildDragons() {
    if (document.getElementById("wildSpawnCheckbox").checked == true) {
        game.spawnWildDragons = true
    }
    else {
        game.spawnWildDragons = false
    }
}

function openEventLog() {
    if (document.getElementById("eventLogTab").style.display == "block") {document.getElementById("eventLogTab").style.display = "none"; return}
    document.getElementById("eventLogTab").style.display = "block"
    document.getElementById("settingsTab").style.display = "none"
    document.getElementById("tipTab").style.display = "none"
    displayEventLog()
}

function displayEventLog() {
    document.getElementById("eventLog").innerText = ""
    if (game.eventLog.length == 0) {
        document.getElementById("eventLog").innerText = "No events yet!"
        return
    }
    for (let i=0;i<game.eventLog.length;i++) {
        document.getElementById("eventLog").innerHTML += game.eventLog[i] + "<br>"
    }
}

function updateEventLog(x) {
    game.eventLog.unshift(x)
    if (game.eventLog.length > 15) game.eventLog.pop()
    if (document.getElementById("eventLogTab").style.display == "block") displayEventLog()
}

function openDailyRoll() {
    if (dailyRollActive) return
    if (document.getElementById("dailyRollTab").style.display == "block") {document.getElementById("dailyRollTab").style.display = "none"; return}
    document.getElementById("dailyRollTab").style.display = "block"
    document.getElementById("breedingTab").style.display = "none"
    document.getElementById("bestiaryTab").style.display = "none"
    document.getElementById("decorationsTab").style.display = "none"
    document.getElementsByClassName("dailyRollIcon")[0].innerHTML = "<p id='dailyRollScore'>+" + format(game.nextRollItems[0]) + "<br>score</p>"
    document.getElementsByClassName("dailyRollIcon")[1].style.backgroundImage = "url('img/dragon" + game.nextRollItems[1] + "-1.png')"
    document.getElementsByClassName("dailyRollIcon")[2].style.backgroundImage = "url('img/decoration" + game.nextRollItems[2] + ".png')"
    if (game.dailyRollCooldown > 0) {
        document.getElementById("dailyRollsLeft").innerHTML = "<b>You have " + game.dailyRolls + " rolls left</b><br>Time until more rolls: " + numberToTime(game.dailyRollCooldown)
    }
    else {
        document.getElementById("dailyRollsLeft").innerHTML = "<b>You have " + game.dailyRolls + " rolls left</b>"
    }
}

function closeDailyRoll() {
    if (dailyRollActive) return
    document.getElementById("dailyRollTab").style.display = "none"
}

function dailyRoll() {
    if (game.dailyRolls == 0 || dailyRollActive) return
    game.dailyRolls--
    if (game.dailyRolls == 0) {
        game.dailyRollCooldown = 86400
        document.getElementById("dailyRollsLeft").innerHTML = "<b>You have " + game.dailyRolls + " rolls left</b><br>Time until more rolls: " + numberToTime(game.dailyRollCooldown)
    }
    dailyRollActive = true
    dailyRollXPos = 0
    dailyRollVelocity = Math.random() * 10 + 40
    if (game.dailyRollCooldown > 0) {
        document.getElementById("dailyRollsLeft").innerHTML = "<b>You have " + game.dailyRolls + " rolls left</b><br>Time until more rolls: " + numberToTime(game.dailyRollCooldown)
    }
    else {
        document.getElementById("dailyRollsLeft").innerHTML = "<b>You have " + game.dailyRolls + " rolls left</b>"
    }
}

function openDecorations() {
    if (document.getElementById("decorationsTab").style.display == "block") {document.getElementById("decorationsTab").style.display = "none"; return}
    if (dailyRollActive) return
    document.getElementById("decorationsTab").style.display = "block"
    document.getElementById("dailyRollTab").style.display = "none"
    document.getElementById("breedingTab").style.display = "none"
    document.getElementById("bestiaryTab").style.display = "none"
    //Create the decoration images
    document.getElementById("decorations").innerHTML = ""
    for (let i=1; i<13; i++) {
        let newDecoration = document.createElement("div")
        newDecoration.className = "decorationImage"
        newDecoration.style.backgroundImage = "url('img/decoration" + i + ".png')"
        newDecoration.innerText = game.decorationsOwned[i-1]
        newDecoration.onclick = function() {placeDecoration(i)}
        document.getElementById("decorations").appendChild(newDecoration)
    }
}

function closeDecorations() {
    document.getElementById("decorationsTab").style.display = "none"
}

function placeDecoration(x) {
    if (game.decorationsOwned[x-1] == 0) return
    game.decorationsOwned[x-1]--
    let randomX = Math.random() * (window.innerWidth-164)+100
    let randomY = Math.random() * (window.innerHeight-164)+100
    game.placedDecorations.push([x-1, randomX, randomY])
    let newDecoration = document.createElement("img")
    newDecoration.className = "placedDecoration"
    newDecoration.src = "img/decoration" + x + ".png"
    newDecoration.style.left = randomX + "px"
    newDecoration.style.top = randomY + "px"
    let decorationLength = game.placedDecorations.length-1
    newDecoration.onclick = function() {displayInfo(5,decorationLength)}
    document.getElementById("game").appendChild(newDecoration)
    for (let i=0; i<12; i++) {
        document.getElementsByClassName("decorationImage")[i].innerText = game.decorationsOwned[i]
    }
}

function removeDecoration(x) {
    game.decorationsOwned[game.placedDecorations[x][0]]++
    game.placedDecorations.splice(x,1)
    document.getElementsByClassName("placedDecoration")[x].remove()
    displayInfo(0)
    //Update the onclick functions
    for (let i=0; i<game.placedDecorations.length; i++) {
        document.getElementsByClassName("placedDecoration")[i].onclick = function() {displayInfo(5,i)}
    }
    if (document.getElementsByClassName("decorationImage").length > 0) {
        for (let i=0; i<12; i++) {
            document.getElementsByClassName("decorationImage")[i].innerText = game.decorationsOwned[i]
        }
    }
}

function removeAllDecorations() {
    for (let i=0; i<game.placedDecorations.length; i++) {
        game.decorationsOwned[game.placedDecorations[i][0]]++
        document.getElementsByClassName("placedDecoration")[0].remove()
    }
    game.placedDecorations = []
    displayInfo(0)
    for (let i=0; i<12; i++) {
        document.getElementsByClassName("decorationImage")[i].innerText = game.decorationsOwned[i]  
    }
}

function openDragonList() {
    if (document.getElementById("dragonListTab").style.display == "block") {document.getElementById("dragonListTab").style.display = "none"; return}
    document.getElementById("dragonListTab").style.display = "block"
    // Sort dragon list by id and bundle in original indexes
    sortedDragons = [...game.dragons].map((x, i) => [x, i]).sort((a, b) => a[0][0] - b[0][0]);
    //List all existing dragons
    document.getElementById("dragonList").innerHTML = ""
    for (let i=0; i<sortedDragons.length; i++) {
        let newSelection = document.createElement("div")
        newSelection.className = "listedDragon"
        newSelection.innerHTML = "<img src='img/dragon" + sortedDragons[i][0][0] + "-1.png' class='listedDragonImage'><p class='listedDragonText'><b>" + dragonNames[sortedDragons[i][0][0]] + "</b><br>" + genders[sortedDragons[i][0][8]] + "<br>Producing " + dragonProductions[sortedDragons[i][0][0]] + " score/second</p>" + "<p style='text-align:top'></p><button id='sendAwayListButton' onclick='sendAwayListCheck(i)'>Send away</button>"

        let sendAwayButton = document.createElement("button");
        sendAwayButton.id = "sendAwayListButton";
        sendAwayButton.textContent = "Send away";

        correctIndex = sortedDragons[i][1];
        // Defining closure to get index of clicked button
        (function(correctIndex) {
            sendAwayButton.onclick = function() {
                sendAwayListCheck(correctIndex);
            };
        })(correctIndex);
        newSelection.appendChild(sendAwayButton)
        document.getElementById("dragonList").appendChild(newSelection)
    }
}

function closeDragonList() {
    document.getElementById("dragonListTab").style.display = "none"
}

function openBreedingSelection(x) {
    document.getElementById("breedingSelectionTab").style.display = "block"
    currentBreedingSelection = x
     // Sort dragon list by id
    sortedDragons = [...game.dragons]
    sortedDragons = sortedDragons.sort((a, b) => a[0] - b[0])
    //List all existing dragons
    document.getElementById("breedingSelectionList").innerHTML = ""
    for (let i=0; i<sortedDragons.length; i++) {
        if (game.selectedBreedingDragons[0] == i || game.selectedBreedingDragons[1] == i) continue
        let newSelection = document.createElement("div")
        newSelection.className = "breedingSelection"
        newSelection.innerHTML = "<img src='img/dragon" + sortedDragons[i][0] + "-1.png' class='breedingSelectionImage'><p class='breedingSelectionText'><b>" + dragonNames[sortedDragons[i][0]] + "</b><br>" + genders[sortedDragons[i][8]] + "</p>"
        newSelection.onclick = function() {selectBreedingDragon(i)}
        document.getElementById("breedingSelectionList").appendChild(newSelection)
    }
}

function openBreeding() {
    if (document.getElementById("breedingTab").style.display == "block") {document.getElementById("breedingTab").style.display = "none"; return}
    if (dailyRollActive) return
    document.getElementById("breedingTab").style.display = "block"
    document.getElementById("bestiaryTab").style.display = "none"
    document.getElementById("dailyRollTab").style.display = "none"
    document.getElementById("decorationsTab").style.display = "none"
    document.getElementById("incubationSkips").innerText = format(game.incubationSkips)
    if (game.incubationSkips == 0) {document.getElementById("incubationSkipButton").disabled = true}
    else {document.getElementById("incubationSkipButton").disabled = false}
    //Update the selected dragon images
    if (game.selectedBreedingDragons[0] > -1) {
        document.getElementsByClassName("selectBreedingDragon")[0].style.backgroundImage = "url('img/dragon" + game.dragons[game.selectedBreedingDragons[0]][0] + "-1.png')"
        document.getElementsByClassName("breedingTitle")[2].innerText = dragonNames[game.dragons[game.selectedBreedingDragons[0]][0]]
    }
    else {
        document.getElementsByClassName("selectBreedingDragon")[0].style.backgroundImage = "none"
        document.getElementsByClassName("breedingTitle")[2].innerText = "No dragon selected..."
    }
    if (game.selectedBreedingDragons[1] > -1) {
        document.getElementsByClassName("selectBreedingDragon")[1].style.backgroundImage = "url('img/dragon" + game.dragons[game.selectedBreedingDragons[1]][0] + "-1.png')"
        document.getElementsByClassName("breedingTitle")[3].innerText = dragonNames[game.dragons[game.selectedBreedingDragons[1]][0]]
    }
    else {
        document.getElementsByClassName("selectBreedingDragon")[1].style.backgroundImage = "none"
        document.getElementsByClassName("breedingTitle")[3].innerText = "No dragon selected..."
    }
    displayBreedingProbabilites()
}

function closeBreeding() {
    document.getElementById("breedingTab").style.display = "none"
}

function openBreedingSelection(x) {
    document.getElementById("breedingSelectionTab").style.display = "block"
    currentBreedingSelection = x
    //List all existing dragons
    document.getElementById("breedingSelectionList").innerHTML = ""
    for (let i=0; i<game.dragons.length; i++) {
        if (game.selectedBreedingDragons[0] == i || game.selectedBreedingDragons[1] == i) continue
        let newSelection = document.createElement("div")
        newSelection.className = "breedingSelection"
        newSelection.innerHTML = "<img src='img/dragon" + game.dragons[i][0] + "-1.png' class='breedingSelectionImage'><p class='breedingSelectionText'><b>" + dragonNames[game.dragons[i][0]] + "</b><br>" + genders[game.dragons[i][8]] + "</p>"
        newSelection.onclick = function() {selectBreedingDragon(i)}
        document.getElementById("breedingSelectionList").appendChild(newSelection)
    }
}

function selectBreedingDragon(x) {
    // Check if the selected dragon is already selected
    if (game.selectedBreedingDragons[currentBreedingSelection-1] == x) {
        // Deselect the dragon
        game.selectedBreedingDragons[currentBreedingSelection-1] = -1
        document.getElementsByClassName("selectBreedingDragon")[currentBreedingSelection-1].style.backgroundImage = "none"
    }
    else {
        // Select the dragon
        game.selectedBreedingDragons[currentBreedingSelection-1] = x
        document.getElementsByClassName("selectBreedingDragon")[currentBreedingSelection-1].style.backgroundImage = "url('img/dragon" + game.dragons[x][0] + "-1.png')"
        document.getElementsByClassName("breedingTitle")[currentBreedingSelection+1].innerText = dragonNames[game.dragons[x][0]]
    }
    // Hide the breeding selection tab
    document.getElementById("breedingSelectionTab").style.display = "none"
    currentBreedingSelection = 0
    displayBreedingProbabilites()
}

function closeBreedingSelection() {
    document.getElementById("breedingSelectionTab").style.display = "none"
    currentBreedingSelection = 0
}

function resetBreedingSelections() {
    game.selectedBreedingDragons = [-1, -1]
    document.getElementsByClassName("selectBreedingDragon")[0].style.backgroundImage = "none"
    document.getElementsByClassName("selectBreedingDragon")[1].style.backgroundImage = "none"
    document.getElementsByClassName("breedingTitle")[2].innerText = "No dragon selected..."
    document.getElementsByClassName("breedingTitle")[3].innerText = "No dragon selected..."
    displayBreedingProbabilites()
}

function displayBreedingProbabilites() {
    if (game.selectedBreedingDragons[0] == -1 || game.selectedBreedingDragons[1] == -1) {
        document.getElementById("breedingProbabilities").innerHTML = "<b>Breeding probabilities:</b><br>Select some dragons to see their probabilities!"
        return
    }
    // Generate breeding probabilities based on the selected dragons
    let probabilities = generateBreedingProbabilities(game.dragons[game.selectedBreedingDragons[0]][0],game.dragons[game.selectedBreedingDragons[1]][0])
    let totalWeight = 0
    // Calculate the total weight of all probabilities
    for (let i=0; i<probabilities.length; i++) {
        totalWeight += probabilities[i][1]
    }
    // Display breeding probabilities
    document.getElementById("breedingProbabilities").innerHTML = "<b>Breeding probabilities:</b>"
    for (let i=0; i<probabilities.length; i++) {
        document.getElementById("breedingProbabilities").innerHTML += "<br><img src='img/dragon" + probabilities[i][0] + "-1.png' style='vertical-align: middle'>" + dragonNames[probabilities[i][0]]+ ": " + format(probabilities[i][1]/totalWeight*100 ,1) + "%"
    }
}

function generateBreedingProbabilities(a,b) {
    //If the dragons are the same, return a 100% chance of the same dragon
    if (a==b && a!=19 && a<32) return [[a,1]]
    //If either dragon is a goat, return a 100% chance of a goat
    if (a==14 || b==14) return [[14,1]]
    //If either dragon is Mr. Gunky, return a 100% chance of Mr. Gunky
    if (a==25 || b==25) return [[25,1]]
    //If either dragon is a rainbow dragon, return all colour dragons
    if (a==19 && b==19) return [[4,5],[16,5],[5,5],[17,5],[6,5],[18,5],[19,5]]
    else if (a==19) return [[b,6],[4,5],[16,5],[5,5],[17,5],[6,5],[18,5],[19,1]]
    else if (b==19) return [[a,6],[4,5],[16,5],[5,5],[17,5],[6,5],[18,5],[19,1]]

    let probabilities = [[a,40],[b,40]]
    if (a==b) probabilities = [[a,40]]
    //Adding extra basic dragon for basic dragons
    if ((a==1&&b==2) || (a==2&&b==1)) probabilities = addBreedingProbability(probabilities,3,20)
    if ((a==1&&b==3) || (a==3&&b==1)) probabilities = addBreedingProbability(probabilities,2,20)
    if ((a==2&&b==3) || (a==3&&b==2)) probabilities = addBreedingProbability(probabilities,1,20)
    //Adding special colour dragons
    if ((a==4&&b==5) || (a==5&&b==4)) probabilities = addBreedingProbability(probabilities,16,25)
    if ((a==5&&b==6) || (a==6&&b==5)) probabilities = addBreedingProbability(probabilities,17,25)
    if ((a==4&&b==6) || (a==6&&b==4)) probabilities = addBreedingProbability(probabilities,18,25)
    if ((a==8&&b==9) || (a==9&&b==8)) probabilities = addBreedingProbability(probabilities,10,25)
    //Adding gummy dragons
    if ((a==20&&b==21) || (a==21&&b==20)) probabilities = addBreedingProbability(probabilities,22,25)
    if ((a==20||a==21||a==22||b==20||b==21||b==22)&&(a!=23&&b!=23)) probabilities = addBreedingProbability(probabilities,23,25)
    //Adding rainbow dragon for colour dragons
    if (colourDragons.includes(a) && colourDragons.includes(b) && a!=19 && b!=19) probabilities = addBreedingProbability(probabilities,19,2)
    else if ((colourDragons.includes(a) || colourDragons.includes(b)) && a!=19 && b!=19) probabilities = addBreedingProbability(probabilities,19,1)
    if ((a==27 && b==28) || (a==28 && b==27)) probabilities = addBreedingProbability(probabilities,19,8)
    //Adding colour dragons for abberation dragon
    if (a==31 || b==31) {probabilities = addBreedingProbability(probabilities,4,30); probabilities = addBreedingProbability(probabilities,6,30)}
    //Adding gemstone dragons
    if (a==b && a>=32) {probabilities = addBreedingProbability(probabilities,a,40)}
    if (a==32 || b==32) {probabilities = addBreedingProbability(probabilities,33,20); probabilities = addBreedingProbability(probabilities,34,10)}
    if (a==33 || b==33) {probabilities = addBreedingProbability(probabilities,34,16); probabilities = addBreedingProbability(probabilities,35,8); probabilities = addBreedingProbability(probabilities,36,3)}
    if (a==34 || b==34) {probabilities = addBreedingProbability(probabilities,33,5); probabilities = addBreedingProbability(probabilities,35,14); probabilities = addBreedingProbability(probabilities,36,8); probabilities = addBreedingProbability(probabilities,37,3)}
    if (a==35 || b==35) {probabilities = addBreedingProbability(probabilities,34,10); probabilities = addBreedingProbability(probabilities,35,14); probabilities = addBreedingProbability(probabilities,36,8); probabilities = addBreedingProbability(probabilities,37,3)}
    if (a==36 || b==36) {probabilities = addBreedingProbability(probabilities,35,15); probabilities = addBreedingProbability(probabilities,36,12); probabilities = addBreedingProbability(probabilities,37,6); probabilities = addBreedingProbability(probabilities,38,3)}
    if (a==37 || b==37) {probabilities = addBreedingProbability(probabilities,35,5); probabilities = addBreedingProbability(probabilities,36,18); probabilities = addBreedingProbability(probabilities,37,10); probabilities = addBreedingProbability(probabilities,38,5)}
    if (a==38 || b==38) {probabilities = addBreedingProbability(probabilities,36,10); probabilities = addBreedingProbability(probabilities,37,22); probabilities = addBreedingProbability(probabilities,39,3)}
    if (a==39 || b==39) {probabilities = addBreedingProbability(probabilities,37,10); probabilities = addBreedingProbability(probabilities,38,22)}
    //Sort the array
    probabilities.sort(function(a, b) {
        return b[1] - a[1];
    });
    return probabilities
}

function addBreedingProbability(probabilityArray, dragon, weight) {
    // Check if the dragon already exists in the array
    for (let i = 0; i < probabilityArray.length; i++) {
        if (probabilityArray[i][0] == dragon) {
            probabilityArray[i][1] += weight;
            return probabilityArray;
        }
    }
    probabilityArray.push([dragon, weight]);
    return probabilityArray;
}

function breed() {
    if (game.selectedBreedingDragons[0] == -1 || game.selectedBreedingDragons[1] == -1) alert("You must select two dragons to breed!")
    document.getElementById("breedButton").style.display = "none"
    //Pick random dragon from the probabilities
    let probabilities = generateBreedingProbabilities(game.dragons[game.selectedBreedingDragons[0]][0],game.dragons[game.selectedBreedingDragons[1]][0])
    let totalWeight = 0
    for (let i=0; i<probabilities.length; i++) {
        totalWeight += probabilities[i][1]
    }
    let random = Math.random() * totalWeight
    let raritySum = 0
    let selectedDragon = -1
    for (let i=0; i<probabilities.length; i++) {
        raritySum += probabilities[i][1]
        if (random < raritySum) {
            selectedDragon = probabilities[i][0]
            break
        }
    }
    game.incubatingDragon = selectedDragon
    game.incubationTime = Math.min(480 * dragonProductions[selectedDragon] + 600, 9000)
    document.getElementById("incubationTab").style.display = "block"
    document.getElementById("incubationImage").src = "img/dragon" + selectedDragon + "-1.png"
    document.getElementById("incubationTitle").innerText = "Incubating " + dragonNames[selectedDragon]
    document.getElementById("incubationTime").innerText = "Time left: " + numberToTime(game.incubationTime)
}

function skipIncubation() {
    if (game.incubationSkips == 0 || game.incubationTime == 0) return
    game.incubationSkips--
    game.incubationTime = 1
    document.getElementById("incubationSkips").innerText = format(game.incubationSkips)
    if (game.incubationSkips == 0) document.getElementById("incubationSkipButton").disabled = true
    if (game.dragons.length >= game.dragonMax) {document.getElementById("incubationTime").innerText = "Time left: " + numberToTime(game.incubationTime) + " (Waiting for space to hatch)"}
    else {document.getElementById("incubationTime").innerText = "Time left: " + numberToTime(game.incubationTime)}
}