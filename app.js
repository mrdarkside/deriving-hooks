"use strict";

mount(document.getElementById("root"),countdownTimer);
mount(document.getElementById("root"),eventLog);



// *************************

function useCountdown(initialCounter,logEvent) {
	var [ countdownStarted, updateCountdownStarted ] = useState(false);
	var [ counter, updateCounter ] = useState(initialCounter);
	var timerRef = useRef();

	useEffect(function handleButtonClick(){
		if (!countdownStarted) {
			let btnEl = document.getElementById("start-countdown");

			let startCountdown = () => {
				countdownStarted = updateCountdownStarted(true);
			};
			// instead of `console.log(..)`
			logEvent("adding click handler");
			btnEl.addEventListener("click",startCountdown,false);

			// cleanup click handler
			return () => {
				// instead of `console.log(..)`
				logEvent("removing click handler");
				btnEl.removeEventListener("click",startCountdown,false);
			};
		}
	});

	useEffectToggle(function setupInterval(){
		// instead of `console.log(..)`
		logEvent("starting countdown timer");
		timerRef.current = setInterval(function countdown(){
			updateCounter(prevCounter => prevCounter - 1);
		},1000);

		// clearup timer interval
		return () => {
			// instead of `console.log(..)`
			logEvent("clearing countdown timer");
			clearInterval(timerRef.current);
		};
	},(countdownStarted && counter > 0));

	return [ countdownStarted, counter ];
}

function useWelcomeMessage(initialMsg,countdownStarted,logEvent) {
	var [ welcomeMsg, setWelcomeMsg ] = useState(initialMsg);
	var timerRef = useRef();

	// delay rendering of a welcome message
	useEffectToggle(function wait(){
		// instead of `console.log(..)`
		logEvent("starting welcome message timer");

		timerRef.current = setTimeout(
			() => setWelcomeMsg("Welcome!"),
			2000
		);
		return () => {
			// instead of `console.log(..)`
			logEvent("clearing welcome message timer");
			clearTimeout(timerRef.current);
		};
	},(!countdownStarted && (welcomeMsg == initialMsg)));

	return welcomeMsg;
}

function useEventLog(onUpdate) {
	var [ useSharedState, store ] = useSharedStore("event-log",onUpdate);
	var [ eventLogMsgs ] = useSharedState("msgs",[]);

	// store event logging callbacks
	var [ useSharedFnState, fnStore ] = useSharedStore("event-log-functions",() => {});
	var [ { log } ] = useSharedFnState("log",{
		log(msg) {
			if (fnStore.has("reverted")) {
				console.log(msg);
			}
			else {
				eventLogMsgs.push(msg);
				store.commitUpdate("msgs");
			}
		}
	});
	var [ { revertLogging } ] = useSharedFnState("revertLogging",{
		revertLogging() {
			fnStore.set("reverted",true);
		}
	});

	return [ log, eventLogMsgs, revertLogging ];
}

function countdownTimer(initialCounter = 5) {
	var [ logEvent ] = useEventLog(() => {});
	var [ countdownStarted, counter	] = useCountdown(initialCounter,logEvent);
	var welcomeMsg = useWelcomeMessage("Loading...",countdownStarted,logEvent);

	return (
		countdownStarted ?
			`<span>${
				(counter > 0) ?
					`Counting down: ${ counter }` :
					"Finished!"
			}
			</span>` :
			`<p>${ welcomeMsg }</p>
			<button type="button" id="start-countdown">start countdown</button>`
	);
}

function useHideEventLogButton(switchToConsoleLogging) {
	useEffect(function handleButtonClick(){
		var btnEl = document.getElementById("hide-event-log-btn");
		var hideEventLog = () => {
			switchToConsoleLogging();
			unmount(document.getElementById("root"),eventLog);
		};
		btnEl.addEventListener("click",hideEventLog,false);

		// cleanup click handler
		return () => {
			// console.log("removing hide-event-log-btn click handler");
			btnEl.removeEventListener("click",hideEventLog,false);
		};
	});
}

function eventLog() {
	var [ , eventLogMsgs, switchToConsoleLogging ] = useEventLog();
	useHideEventLogButton(switchToConsoleLogging);

	// collect messages (if any)
	var messages = "";
	for (let msg of eventLogMsgs) {
		messages += `<div>${ msg }</div>`;
	}

	return (`
		<hr>
		<h3>Event Log <button type="button" id="hide-event-log-btn">X</button></h3>
		${
			(messages != "") ?
				messages :
				`<div>--empty--</div>`
		}
	`);
}
