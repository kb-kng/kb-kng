// JUMPER - By how units will window move every tick
// DEAD_ZONE - specifies how much units won't be count

// DEAD_ZONE_MODE - specifies which wall will be affected by dead zone (for most windows users it's 2-  left)
// 0 - TOP | 1 - LEFT | 2 - BOTTOM | 3 - RIGHT

// FREQ - How fast to move window (higher - slower)
const JUMPER = Number(localStorage.getItem('SETTINGS.JUMPER') || 5),
    DEAD_ZONE = 50,
    DEAD_ZONE_MODE = 2,
    FREQ = Number(localStorage.getItem("SETTINGS.FREQ") || 50)

// ================


const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const screenSize = {
    h: window.screen.height - 5,
    w: window.screen.width - 5
}

const waitFor_DELAY = 50, waitFor_TIMEOUT = 8000;
const waitFor = async (o) => new Promise((rs,re) => {
    const errorTimeout = setTimeout(() => {
        clearInterval(waitForInterval);
        re(['timeout', waitFor_TIMEOUT]);
    }, waitFor_TIMEOUT)
    const waitForInterval = setInterval(() => {
        if(o) {
            clearTimeout(errorTimeout);
            rs(true)
        }
    }, waitFor_DELAY);
}) 

/** @type {DVD_SS[]} */
let popups = [];

const DVD_Event = class {
    name = "";
    executor = () => {};
    once = false;
    constructor(name, executor, once = this.once){
        this.name = name;
        this.executor = executor;
        this.once = once;
    }
}

const DVD_SS = class {
    /** @type {DVD_Event[]} */
    _events = [];
    closed = true;
    size = {
        h: 260,
        w: 320
    }
    pos = {
        x: getRandomInt(0, screenSize.w - this.size.w),
        y: getRandomInt(0, screenSize.h - this.size.h - DEAD_ZONE)
    }
    xx = Boolean(getRandomInt(0,1));
    yy = Boolean(getRandomInt(0,1));
    /** @type {Window} */
    window = null;
    /** @type {number} */
    moveInterval = null;

    constructor(autoStart = true){
        if(autoStart) this.start();
    }

    async start() {
        this.load();
    }

    async close() {
        this.window.close();
        this.closed = true;
        this.emit('closed')
    }

    async load() {
        this.window = window.open("dvd.html", "_blank", `popup`)
        this.closed = false;
        this.window.resizeTo(this.size.w, this.size.h)
        this.window.moveTo(this.pos.x, this.pos.y)
        this.window.addEventListener('beforeunload', () => this.close(), {once: true})
        this.window.addEventListener('load', () => {
            setTimeout(() => {
                this.startMoving() // Little delay to allow everything to load.
            }, 100);
        }, {once: true})
    }

    startMoving() {
        this.window.postMessage(['sendInitialData', {xx:this.xx, yy:this.yy, pos: this.pos, size: this.size, JUMPER, FREQ, DEAD_ZONE, screenSize}])
    }



    // EVENTS PART
    /**
     * 
     * @param {String} evName 
     * @param {any} data 
     */
    emit(evName, data) {
        const events = this._events.filter(ev => ev.name === evName);
        for(let ev of events){
            ev.executor(this, data)
            if(ev.once) this._events.splice(this._events.indexOf(ev), 1) // Remove onces
        }
    }

    /**
     * 
     * @param {String} evName 
     * @param {(clas:this,data:any) => any} executor 
     */
    on(evName, executor) {
        this._events.push(new DVD_Event(evName, executor))
    }

    /**
     * @param {String} evName 
     * @param {(clas:this,data:any) => any} executor 
     */
    once(evName, executor) {
        this._events.push(new DVD_Event(evName, executor, true))
    }
}

let nextWindowAllowed = 0;
const spawnLogo = () => {
    if(nextWindowAllowed > Date.now()) return;
    nextWindowAllowed = Date.now() + 1000

    const dvd = new DVD_SS();

    dvd.once('closed', (cls) => {
        popups.splice(popups.indexOf(cls), 1)
        doUpdateCounter();
    })

    popups.push(dvd);
}



const clearLogos = () => {
    popups.forEach(p => p.window.postMessage(['exit']))
}
window.addEventListener('beforeunload', clearLogos, {capture: true})

