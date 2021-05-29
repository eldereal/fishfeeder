import AsyncStorage from '@react-native-community/async-storage';
import React from 'react';
import { useEffect } from 'react';
import { useState } from 'react';
import { View, Text, Image, TouchableNativeFeedback, ScrollView } from 'react-native';
import Control from './Control';
import ModelView from './ModelView';
import { useCoEffect } from './useCo';
import Wifi from './Wifi';

const styles = {
    tab: {flex: 1, alignItems: 'center', justifyContent: 'center'},
    tabActive: {flex: 1, backgroundColor: '#FDF6E3', alignItems: 'center', justifyContent: 'center'}
}

/** @type {{ deviceId:string, deviceSecret: string }} */
const nullData = null;

export default function Main(){
    const [tab, setTab] = useState(0);
    const [blueLightOn, setBlueLightOn] = useState(false);
    const [angle, setAngle] = useState(45);
    const [distance, setDistance] = useState(150);
    const [data, setData] = useState(null);
    const [tabEnabled, setTabEnabled] = useState(true);
    const [rodAngle, setRodAngle] = useState(0);

    useCoEffect(function*(){
        const data = yield AsyncStorage.getItem("device");
        let parsed;
        if (data) {
            try {
                parsed = JSON.parse(data);
            } catch (ignored) {
                
            }
        }
        const d = parsed || {};
        setData(d);
        setTab(d.deviceId ? 0 : 1);
    }, []);
    /** @param {{ deviceId?:string, deviceSecret?: string }} data */
    async function setDataWithStore(data) {
        await AsyncStorage.setItem("device", JSON.stringify(data));
        setData(data);
    }
    if (!data) {
        return <View
            style={{flex: 1, backgroundColor: '#FDF6E3'}}
        ></View>
    }
    return <View
        style={{flex: 1, backgroundColor: '#FDF6E3'}}
    >
        <View style={{flex:1}}>
            <ScrollView style={{height: '100%', width: '100%'}}>
                <View style={{aspectRatio: 1, backgroundColor: '#FDF6E3'}}>
                    <ModelView angle={angle} distance={distance} blueLightOn={blueLightOn} rodAngle={rodAngle} />
                </View>
                <View style={{flex: 1}}>
                    {tab === 0 ? (
                        <Control data={data} setData={setDataWithStore} setAngle={setAngle} setDistance={setDistance} setBlueLightOn={setBlueLightOn} setRodAngle={setRodAngle} />
                    ):null}
                    {tab === 1 ? (
                        <Wifi data={data} setData={setDataWithStore} setAngle={setAngle} setDistance={setDistance} setBlueLightOn={setBlueLightOn} setTabEnabled={setTabEnabled} setTab={setTab}/>
                    ):null}
                </View>
            </ScrollView>
        </View>
        <View style={{backgroundColor:'#D9D2C2', height:60, flexDirection: 'row'}}>
            <TouchableNativeFeedback onPress={() => setTab(0)} disabled={!tabEnabled}>
                <View style={tab === 0 ? styles.tabActive : styles.tab}>
                    <Image 
                        source={ require('./control.png')} 
                        style={{ width: 32, height: 32, opacity: tab === 1 ? 1 : 0.7 }}
                    />
                    <Text style={{ opacity: tab === 1 ? 1 : 0.7 }}>控制</Text>
                </View>
            </TouchableNativeFeedback>
            <TouchableNativeFeedback onPress={() => setTab(1)} disabled={!tabEnabled}>
                <View style={tab === 1 ? styles.tabActive : styles.tab}>
                    <Image 
                        source={ require('./wifi.png')} 
                        style={{ width: 32, height: 32, opacity: tab === 1 ? 1 : 0.7 }}
                    />
                    <Text style={{ opacity: tab === 1 ? 1 : 0.7 }}>联网</Text>
                </View>
            </TouchableNativeFeedback>
        </View>
    </View>
}