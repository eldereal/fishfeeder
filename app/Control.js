import React, { useEffect } from 'react';
import { useState } from 'react';
import { View, Text, TouchableNativeFeedback, ActivityIndicator, StyleSheet } from "react-native";
import { action } from './api';
import { useCoCallback } from './useCo';

const styles = StyleSheet.create({
    select1: { 
        flex: 1, 
        height: 44, 
        backgroundColor:'rgba(0,0,0,0.05)', 
        marginVertical: 8, 
        borderTopLeftRadius: 5, 
        borderBottomLeftRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    select2: { 
        flex: 1, 
        height: 44, 
        backgroundColor:'rgba(0,0,0,0.05)', 
        marginVertical: 8, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    select3: { 
        flex: 1, 
        height: 44, 
        backgroundColor:'rgba(0,0,0,0.05)', 
        marginVertical: 8, 
        borderTopRightRadius: 5, 
        borderBottomRightRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    select1active: { 
        flex: 1, 
        height: 44, 
        backgroundColor: '#57B3A8',
        marginVertical: 8, 
        borderTopLeftRadius: 5, 
        borderBottomLeftRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    select2active: { 
        flex: 1, 
        height: 44, 
        backgroundColor:'#57B3A8', 
        marginVertical: 8, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    select3active: { 
        flex: 1, 
        height: 44, 
        backgroundColor:'#57B3A8', 
        marginVertical: 8, 
        borderTopRightRadius: 5, 
        borderBottomRightRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectText: {
        fontSize: 16,
        color: '#333'
    },
    selectTextActive: {
        fontSize: 16,
        color: 'white'
    }
});

/**
 * @param {{
 *   data: { deviceId?:string, deviceSecret?: string },
 *   setData: (data: { deviceId?:string, deviceSecret?: string }) => void,
 *   setAngle: (a: number) => void,
 *   setDistance: (d: number) => void,
 *   setBlueLightOn: (on: boolean) => void,
 * }} param0 
 * @returns 
 */
export default function Control({ data, setAngle, setDistance, setBlueLightOn, setRodAngle }) {
    const [loading, setLoading] = useState(false);
    const [cycles, setCycles] = useState(0);
    useEffect(() => {
        if (cycles) {
            setAngle(-70);
            setDistance(110); 
            setBlueLightOn(false);
            setRodAngle(a => a + cycles / 8 * 360);
        } else {
            setAngle(45);
            setDistance(150); 
            setBlueLightOn(false);
        }
    }, [cycles]);

    const onSubmit = useCoCallback(function*(){
        try {
            if (cycles === 0) {
                throw new Error('请先选择一个份数');
            }
            setLoading(true);
            yield action(data.deviceId, data.deviceSecret, cycles);
            alert("成功发送指令");
            yield new Promise(fulfill => setTimeout(fulfill, 3000));
            setLoading(false);
            setCycles(0);
        } catch (e) {
            alert(e.message);
            setLoading(false);
        }
    }, [cycles]);

    if (!data.deviceId) {
        return <View style={{ flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Text>尚未添加设备，请使用“联网”功能先添加设备。</Text>
        </View>
    }
    return <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text style={{fontSize: 16, lineHeight: 24, marginBottom: 16}}>设备编号：{data.deviceId}</Text>
        <Text style={{fontSize: 16, lineHeight: 24, marginBottom: 16}}>选择送料份数（一份为蜗杆转动一圈）</Text>
        <View style={{flexDirection: 'row'}}>
            <TouchableNativeFeedback onPress={() => setCycles(c => c === 4 ? 0 : 4)} disabled={loading}>
                <View style={cycles === 4 ? styles.select1active : styles.select1}>
                    <Text style={ cycles === 4 ? styles.selectTextActive : styles.selectText}>
                        半份
                    </Text>
                </View>
            </TouchableNativeFeedback>
            <TouchableNativeFeedback onPress={() => setCycles(c => c === 8 ? 0 : 8)} disabled={loading}>
                <View style={cycles === 8 ? styles.select2active : styles.select2}>
                    <Text style={ cycles === 8 ? styles.selectTextActive : styles.selectText}>
                        一份
                    </Text>
                </View>
            </TouchableNativeFeedback>
            <TouchableNativeFeedback onPress={() => setCycles(c => c === 16 ? 0 : 16)}  disabled={loading}>
                <View style={cycles === 16 ? styles.select3active : styles.select3}>
                    <Text style={ cycles === 16 ? styles.selectTextActive : styles.selectText}>
                        两份
                    </Text>
                </View>
            </TouchableNativeFeedback>
        </View>
        <TouchableNativeFeedback disabled={loading} onPress={onSubmit}>
            <View style={{ marginTop: 32, marginBottom: 32, height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#57B3A8', borderRadius: 5}}>
                {loading ? (
                    <ActivityIndicator animating={true} color="white" />
                ):(
                    <Text style={{fontSize: 16, color: 'white'}}>启动送料</Text>
                )}
            </View>
        </TouchableNativeFeedback>
    </View>
}