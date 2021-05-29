import { NativeModules, NativeEventEmitter } from "react-native";
const { ESPTouch } = NativeModules;
import EventEmitter from 'events';
import { useEffect } from "react";
import { useState } from "react";
import { useCoEffect } from "./useCo";

/** 
 * @typedef {{
 *   success: boolean,
 *   message: string,
 *   ssid: string, 
 *   bssid?:string
 * }} WifiInfo
 */

/** @type {WifiInfo} */
let wifiInfo;
const wifiEvents = new EventEmitter();

/** @type { Promise<void> } */
let initPromise;

/** @type { ['pending' | 'success' | 'error', string] } */
let startState = ['pending', ''];

async function _init(){
    try {
        new NativeEventEmitter(ESPTouch).addListener("onWifiChanged", data => {
            wifiInfo = data;
            wifiEvents.emit("onWifiChanged", data);
        });
        await ESPTouch.init();        
    } catch (e) {
        if (e.code == 'ENOPERMISSION') {
            throw new Error("没有权限访问WiFi信息");
        }
        throw e;
    }
}

export async function init() {
    if (!initPromise) {
        initPromise = _init();
        initPromise.then(() => {
            startState = ['success', ''];
        }, err => {
            startState = ['error', err.message];
        });
    }
    return initPromise;
}

/**
 * @param {string} ssid 
 * @param {string} password 
 * @returns { Promise<{address:string}> }
 */
export function deviceConnectWifi(ssid, password) {
    return ESPTouch.start(ssid, password);
}

/**
 * @returns { [state: 'pending' | 'success' | 'error', message: string] }
 */
export function useInitESPTouch() {
    const [state, setState] = useState(startState);
    useCoEffect(function *() {
        try {
            yield init();
            setState(s => {
                if (s[0] !== 'success' || s[1] !== '') {
                    return ['success', '']
                }
                return s;
            });
        } catch (e) {
            setState(s => {
                if (s[0] !== 'error' || s[1] !== e.message) {
                    return ['error', e.message];
                }
                return s;
            });
        }
    }, []);
    return state;
}

export function useWifiInfo() {
    const init = useInitESPTouch();
    const [info, setInfo] = useState(wifiInfo);
    useEffect(() => {
        wifiEvents.on("onWifiChanged", setInfo);
        return () => { wifiEvents.off("onWifiChanged", setInfo); };
    }, []);
    /** @type {[WifiInfo, [state: 'pending' | 'success' | 'error', message: string]]} */
    const r = [info, init];
    return r;
}
