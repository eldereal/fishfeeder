import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableNativeFeedback, ActivityIndicator } from "react-native";
import { validate } from './api';
import { deviceConnectWifi, useWifiInfo } from './ESPTouch';
import { useCoCallback } from './useCo';

export default function Wifi({ setAngle, setData, setDistance, setBlueLightOn, setTabEnabled, setTab }) {
    const [{ success = false, message = "", ssid = "" } = {}, [state, error]] = useWifiInfo();
    const [pwd, setPwd] = useState("");
    const [code, setCode] = useState("");
    const [secret, setSecret] = useState("");
    const allowConnect = state === 'success' && success;
    const [loading, setLoading] = useState(0);
    useEffect(() => {
        if (state === 'success') {
            setAngle(90);
            setDistance(90);
            let i = 0;
            let t = setTimeout(() => {
                t = setInterval(() => {
                    i ++;
                    setBlueLightOn(Boolean(i % 2));
                }, 500);
            }, 500);
            return () => clearInterval(t);
        }
    }, [allowConnect]);

    const onConnWifi = useCoCallback(function*(isCancelled) {
        try {
            setTabEnabled(false);
            setLoading(1);
            console.info("validate device code", code);
            yield validate(code, secret);
            console.info("deviceConnectWifi", ssid, pwd)
            yield deviceConnectWifi(ssid, pwd || "");
            yield new Promise(fulfill => setTimeout(fulfill, 3000));
            yield setData({ deviceId: code, deviceSecret: secret });
            alert("联网成功，您现在可以使用“控制”功能操作设备");
            setTabEnabled(true);
            setLoading(0);
            setTab(0);
        } catch (e) {
            setTabEnabled(true);
            setLoading(0);
            alert(e.message);
        }
    }, [ssid, pwd, code, secret]);

    const onAddDeviceDirect = useCoCallback(function*(isCancelled) {
        try {
            setTabEnabled(false);
            setLoading(2);
            console.info("validate device code", code);
            yield validate(code, secret);
            yield new Promise(fulfill => setTimeout(fulfill, 3000));
            yield setData({ deviceId: code, deviceSecret: secret });
            alert("添加设备成功，您现在可以使用“控制”功能操作设备");
            setTabEnabled(true);
            setLoading(0);
            setTab(0);
        } catch (e) {
            setTabEnabled(true);
            setLoading(0);
            alert(e.message);
        }
    }, [code, secret]);

    if (state === 'success' && !success) {
        return <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <View><Text>获取Wifi信息失败，请稍后重试</Text></View>
            <View><Text>{ message }</Text></View>
        </View> 
    }
    if (state === 'pending') {
        return <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <View><Text>正在获取Wifi信息，请稍候</Text></View>
        </View>
    }
    if (state === 'error') {
        return <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <View><Text>获取Wifi信息失败，请稍后重试</Text></View>
            <View><Text>{ error }</Text></View>
        </View> 
    }
    return <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <View style={{
            position: 'absolute',
            left: '65%',
        }}>
            <View style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 20,
                height: 20,
                borderColor: "#333333",
                borderTopWidth: 4,
                borderLeftWidth: 4,
                transform: [{ rotate: '45deg' }]
            }} />
            <View style={{
                left: 8,
                top: 0,
                height: 50,
                borderColor: "#333333",
                borderLeftWidth: 4,
            }} />
        </View>
        <View style={{height: 60}} />
        <Text style={{fontSize: 16, lineHeight: 24}}>
            1. 使用坚硬的针长按设备右下方内部的复位按钮。
        </Text>
        <Text style={{fontSize: 16, lineHeight: 24}}>
            2. 等待蓝色指示灯开始持续闪烁。
        </Text>
        <Text style={{fontSize: 16, lineHeight: 24, marginBottom: 16}}>
            3. 在下方输入你的WiFi密码和设备编号、密码，点击“设备联网”。
        </Text>
        <Text style={{fontSize: 16, lineHeight: 24}}>
            &gt; 如果联网成功，蓝色指示灯将会熄灭。
        </Text>
        <Text style={{fontSize: 16, lineHeight: 24}}>
            &gt; 如果蓝色指示灯长亮，代表WiFi密码错误。请重新按压复位按钮，在下方重新输入WiFi密码。
        </Text>
        <Text style={{fontSize: 16, lineHeight: 24, marginBottom: 16}}>
            &gt; 如果蓝色指示灯间歇性短闪三次，说明WiFi连接成功，但是无法连接到互联网。请检查你的网络连接。
        </Text>
        <Text>WiFi热点名称：</Text>
        <TextInput value={ssid} editable={false} style={{backgroundColor:'rgba(0,0,0,0.05)', marginVertical: 8, borderRadius: 5}}/>
        <Text>WiFi密码：</Text>
        <TextInput value={pwd} editable={!loading} onChangeText={setPwd} secureTextEntry style={{backgroundColor:'rgba(0,0,0,0.05)', marginVertical: 8, borderRadius: 5}}/>
        <Text>设备编号：</Text>
        <TextInput keyboardType="decimal-pad" editable={!loading} onChangeText={setCode} value={code} style={{backgroundColor:'rgba(0,0,0,0.05)', marginVertical: 8, borderRadius: 5}}/>
        <Text>设备密码：</Text>
        <TextInput value={secret} editable={!loading} onChangeText={setSecret} secureTextEntry style={{backgroundColor:'rgba(0,0,0,0.05)', marginVertical: 8, borderRadius: 5}}/>
        <TouchableNativeFeedback onPress={onConnWifi} disabled={Boolean(loading)}>
            <View style={{ marginTop: 16, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#57B3A8', borderRadius: 5}}>
                {loading === 1 ? (
                    <ActivityIndicator animating={true} color="white" />
                ):(
                    <Text style={{fontSize: 16, color: 'white'}}>设备联网</Text>
                )}
            </View>
        </TouchableNativeFeedback>
        <TouchableNativeFeedback onPress={onAddDeviceDirect} disabled={Boolean(loading)}>
            <View style={{ marginTop: 16, marginBottom: 32, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#57B3A8', borderRadius: 5}}>
                {loading === 2 ? (
                    <ActivityIndicator animating={true} color="white" />
                ):(
                    <Text style={{fontSize: 16, color: 'white'}}>跳过联网直接添加设备</Text>
                )}
            </View>
        </TouchableNativeFeedback>
    </View>
}