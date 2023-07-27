import React, {useCallback, useEffect, useState} from 'react';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text, TextInput,
    TouchableOpacity,
    View,
    ActivityIndicator
} from 'react-native';
import { debounce } from "lodash";
import { MagnifyingGlassIcon  } from "react-native-heroicons/outline";
import { CalendarDaysIcon, MapPinIcon } from "react-native-heroicons/solid";
import { fetchLocations, fetchWeatherForecast } from "../api/weather";
import { weatherImages } from "../constants";
import { theme } from "../theme";
import { getData, storeData } from "../utils/asyncStorage";

export const HomeScreen = () => {
    const [showSearch, setShowSearch] = useState(false);
    const [locations, setLocations] = useState([]);
    const [weather, setWeather] = useState({});
    const [loading, setLoading] = useState(false);
    const handleLocation = (loc) => {
        setLocations([]);
        setLoading(true);
        fetchWeatherForecast({
            cityName: loc.name,
            days: "7",
        }).then(data => {
            setWeather(data);
            setLoading(false);
            storeData('city', loc.name);
        })
    };

    const handleSearch = (value) => {
        if (value.length > 2) {
            fetchLocations({ cityName: value} ).then(data => {
                setLocations(data);
            })
        }
    };

    useEffect(() => {
        fetchMyWeatherData();
    }, []);

    const fetchMyWeatherData = async () => {
        let myCity = await getData('city');
        let cityName = "Lviv";
        if (myCity) cityName = myCity;
        fetchWeatherForecast({
            cityName,
            days: "7",
        }).then(data => {
            setWeather(data);
        })
    }

    const handleTextDebounce = useCallback(debounce(handleSearch, 600), []);

    const { current, location } = weather;
    return (
        <View style={styles.home}>
            <Image
                style={styles.backgroundImage}
                blurRadius={70}
                source={require('../assets/images/bg.png')}
            />
            {
                loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size={"large"} />
                    </View>
                ) : (
                    <SafeAreaView style={styles.container}>
                        <View style={[styles.inputContainer, { backgroundColor: showSearch ? theme.bgWhite(0.2) : "transparent"}]}>
                            {showSearch ? (
                                <TextInput
                                    onChangeText={handleTextDebounce}
                                    placeholder="Search city"
                                    placeholderTextColor={'lightgray'}
                                    style={styles.input}
                                />
                            ) : null }
                            <TouchableOpacity
                                onPress={() => setShowSearch(!showSearch)}
                                style={[styles.inputIcon, { backgroundColor: theme.bgWhite(0.3) }]}
                            >
                                <MagnifyingGlassIcon size={25} color="white" />
                            </TouchableOpacity>
                            {locations.length > 0 && showSearch ? (
                                <View style={styles.inputModal}>
                                    {
                                        locations.map((loc, index) => {
                                            return (
                                                <TouchableOpacity
                                                    key={index}
                                                    onPress={() => handleLocation(loc)}
                                                    style={[styles.inputModalContent, index === locations.length - 1 ? styles.lastInputModalContent : null]}
                                                >
                                                    <MapPinIcon size={20} color="gray" />
                                                    <Text style={styles.inputModalContentText}>
                                                        {loc?.name} {locations.length > 0 ? ',' : null} {loc?.country}
                                                    </Text>
                                                </TouchableOpacity>
                                            )
                                        })
                                    }
                                </View>
                            ) : null}
                        </View>
                        {/* forecast section */}
                        <View style={styles.forecastContainer}>
                            {/* location */}
                            <Text style={styles.forecastContainerText}>
                                {location?.name},
                                <Text style={styles.forecastContainerSubText}>
                                    {" " + location?.country}
                                </Text>
                            </Text>
                            {/* weather image */}
                            <View style={styles.forecastContainerImageCont}>
                                <Image
                                    style={styles.forecastContainerImage}
                                    source={weatherImages[current?.condition?.text]}
                                />
                            </View>
                            {/* degree celcius */}
                            <View style={styles.degreeCelciusContainer}>
                                <Text style={styles.degreeCelciusContainerText}>
                                    {current?.temp_c}&#176;
                                </Text>
                                <Text style={styles.degreeCelciusContainerTextSecond}>
                                    {current?.condition?.text}
                                </Text>
                            </View>
                            {/* other stats */}
                            <View style={styles.otherStatsContainer}>
                                <View style={styles.otherStatsContainerItem}>
                                    <Image
                                        style={styles.otherStatsContainerItemImage}
                                        source={require('../assets/icons/wind.png')}
                                    />
                                    <Text style={styles.otherStatsContainerItemText}>{current?.wind_kph}km</Text>
                                </View>
                                <View style={styles.otherStatsContainerItem}>
                                    <Image
                                        style={styles.otherStatsContainerItemImage}
                                        source={require('../assets/icons/drop.png')}
                                    />
                                    <Text style={styles.otherStatsContainerItemText} >{current?.humidity}%</Text>
                                </View>
                                <View style={styles.otherStatsContainerItem}>
                                    <Image
                                        style={styles.otherStatsContainerItemImage}
                                        source={require('../assets/icons/sun.png')}
                                    />
                                    <Text style={styles.otherStatsContainerItemText}>{weather?.forecast?.forecastday[0]?.astro?.sunrise}</Text>
                                </View>
                            </View>
                        </View>
                        {/* forecast section for next days */}
                        <View style={styles.nextDaysContainer}>
                            <View style={styles.nextDaysCalendarContainer}>
                                <CalendarDaysIcon size="22" color="white" />
                                <Text style={{ color: "white", fontSize: 17, padding: 0, margin: 0 }}> Daily forecast</Text>
                            </View>
                            <ScrollView
                                horizontal={true}
                                showsHorizontalScrollIndicator={true}
                                contentContainerStyle={{ gap: 15 }}
                            >
                                {weather?.forecast?.forecastday?.map((item, index) => {
                                    let date = new Date(item.date);
                                    let options = { weekday: 'long' };
                                    let dayName = date.toLocaleDateString('en-US', options);
                                    dayName = dayName.split(',')[0];
                                    return (
                                        <View
                                            style={styles.nextDaysItem}
                                            key={index}
                                        >
                                            <Image style={{ width: 45, height: 45 }} source={weatherImages[item?.day?.condition?.text]}/>
                                            <Text style={{ color: "white", fontSize: 14 }}>{dayName}</Text>
                                            <Text style={{ color: "white", fontSize: 14, fontWeight: "bold" }}>{item?.day?.avgtemp_c}&#176;</Text>
                                        </View>
                                    )
                                })}

                            </ScrollView>
                        </View>
                    </SafeAreaView>
                )
            }
        </View>
    );
};

const styles= StyleSheet.create({
    home: {
        flex: 1,
        position: "relative",
    },
    backgroundImage: {
        zIndex: 0,
        height: "100%",
        width: "100%",
        position: "absolute",
    },
    container: {
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        height: "100%"
    },
    inputContainer: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        width: "90%",
        height: "7%",

        borderColor: 'gray',
        borderRadius: 30,
        paddingHorizontal: 6,
        zIndex: 1,
    },
    input: {
        height: "100%",
        width: "86%",
        borderColor: "gray",
        color: "white",
        fontSize: 16,
        paddingLeft: 20,
    },
    inputModal: {
        position: "absolute",
        top: "110%",
        left: 0,
        right: 0,
        backgroundColor: "white",
        borderRadius: 30,
    },
    inputModalContent: {
        flexDirection: "row",
        alignItems: "center",
        border: 0,
        padding: 20,
        borderBottomWidth: 1,
        borderColor: "gray",
    },
    inputModalContentText: {
        color: "black",
        paddingLeft: 5,
    },
    lastInputModalContent: {
        borderBottomWidth: 0,
    },
    inputIcon: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: 45,
        height: 45,
        borderRadius: "50%",
    },
    forecastContainer: {
        height: "76%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-around",
    },
    forecastContainerText: {
        color: "white",
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        margin: 0,
        padding: 0,
    },
    forecastContainerImageCont: {
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: 250,
        height: 250,
    },
    forecastContainerImage: {
        width: 250,
        height: 250,
    },
    forecastContainerSubText: {
        fontWeight: "normal",
        fontSize: 22,
    },
    degreeCelciusContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
    degreeCelciusContainerText: {
        color: "white",
        fontSize: 60,
        fontWeight: "bold",
    },
    degreeCelciusContainerTextSecond: {
        color: "white",
        fontSize: 26,
    },
    otherStatsContainer: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        width: "90%",
    },
    otherStatsContainerItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    otherStatsContainerItemText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    otherStatsContainerItemImage: {
        width: 24,
        height: 24,
    },
    loaderContainer: {
        flex: 1,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "transparent",
    },
    nextDaysContainer: {
        width: "90%",
        height: "17%",
    },
    nextDaysCalendarContainer: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    nextDaysItem: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
        backgroundColor: theme.bgWhite(0.15),
        height: "80%",
        borderRadius: 20,
        paddingHorizontal: 5,
        width: 100,
    },

});
