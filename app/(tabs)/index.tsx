import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native'

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function HealthTrackerScreen() {
  // Input states for water interval and pill time.
  const [waterInterval, setWaterInterval] = useState('')
  const [pillTimeInput, setPillTimeInput] = useState('')
  const [pillTimes, setPillTimes] = useState<string[]>([])

  // Pill status: mapping each pill time to its daily status for Mon-Fri.
  // Initially, every pill is "on" (true).
  const [pillStatus, setPillStatus] = useState<{
    [time: string]: { [day: string]: boolean }
  }>({})

  // Add a new pill time and set its status to true (on) for each day.
  const addPillTime = () => {
    const trimmed = pillTimeInput.trim()
    if (trimmed !== '' && !pillTimes.includes(trimmed)) {
      setPillTimes([...pillTimes, trimmed])
      setPillStatus(prev => ({
        ...prev,
        [trimmed]: daysOfWeek.reduce(
          (acc, day) => ({ ...acc, [day]: true }),
          {}
        ),
      }))
      setPillTimeInput('')
    }
  }

  // "Click-to-turn-off": if the pill is on (true), clicking sets it to off (false).
  const markPillAsTaken = (time: string, day: string) => {
    setPillStatus(prev => {
      // If already off, do nothing.
      if (!prev[time][day]) return prev
      return {
        ...prev,
        [time]: {
          ...prev[time],
          [day]: false,
        },
      }
    })
  }

  // Process an ESP32 input.
  // For this demo, if the input matches a pill time exactly,
  // we mark that pill as taken for the current day (assumed "Mon").
  const processESP32Input = (input: string) => {
    const currentDay = 'Mon' // Update as needed for dynamic current day.
    if (pillTimes.includes(input)) {
      markPillAsTaken(input, currentDay)
    }
  }

  // For simulating ESP32 input.
  const [espInput, setEspInput] = useState('')

  // -------------------------------
  // New Functions for Timers
  // -------------------------------

  // Function to be called when a pill time is reached.
  const handlePillTime = (time: string) => {
    console.log(`It's pill time for ${time}!`)
    // Add any functionality you want here, e.g., send a notification.
  }

  // Function to be called when the water interval elapses.
  const handleWaterReminder = () => {
    console.log('Water sip time reminder!')
    // Add any functionality you want here, e.g., send a notification.
  }

  // Check every minute to see if the current time matches any pill time.
  useEffect(() => {
    const checkPillTimes = setInterval(() => {
      const now = new Date()
      // Format current time as "HH:mm" (24-hour format).
      const currentTime = now
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        .trim()
      // Check if any pill time matches the current time.
      pillTimes.forEach(time => {
        if (time === currentTime) {
          handlePillTime(time)
        }
      })
    }, 60000) // Check every minute.

    return () => clearInterval(checkPillTimes)
  }, [pillTimes])

  // Set up an interval based on the waterInterval input.
  useEffect(() => {
    const intervalMinutes = parseInt(waterInterval)
    if (!isNaN(intervalMinutes) && intervalMinutes > 0) {
      const waterTimer = setInterval(() => {
        handleWaterReminder()
      }, intervalMinutes * 60000) // Convert minutes to milliseconds.
      return () => clearInterval(waterTimer)
    }
  }, [waterInterval])

  // Render the Pill Schedule Table.
  const PillTable = () => (
    <View style={styles.table}>
      {/* Header Row */}
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        <View style={styles.tableCell}>
          <Text style={[styles.tableHeader, styles.tableCellText]}>Time</Text>
        </View>
        {daysOfWeek.map(day => (
          <View key={day} style={styles.tableCell}>
            <Text style={[styles.tableHeader, styles.tableCellText]}>{day}</Text>
          </View>
        ))}
      </View>
      {/* Data Rows */}
      {pillTimes.map(time => (
        <View key={time} style={styles.tableRow}>
          <View style={styles.tableCell}>
            <Text style={styles.tableCellText}>{time}</Text>
          </View>
          {daysOfWeek.map(day => (
            <TouchableOpacity
              key={`${time}-${day}`}
              style={[styles.tableCell, styles.touchable]}
              onPress={() => markPillAsTaken(time, day)}
            >
              {pillStatus[time] && pillStatus[time][day] ? (
                <Text
                  style={[
                    styles.pillEmoji,
                    pillStatus[time] && pillStatus[time][day]
                      ? styles.onEmoji
                      : styles.offEmoji,
                  ]}
                >
                  💊
                </Text>
              ) : (
                <></>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  )

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Health Tracker</Text>

      {/* Water Sip Interval Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Time between water sips (minutes):</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 45"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          value={waterInterval}
          onChangeText={setWaterInterval}
        />
      </View>

      {/* Pill Time Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Enter Pill Time (e.g., 13:00):</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Enter pill time"
            placeholderTextColor="#aaa"
            value={pillTimeInput}
            onChangeText={setPillTimeInput}
          />
          <View style={styles.addButton}>
            <Button title="Add" onPress={addPillTime} color="#fff" />
          </View>
        </View>
      </View>

      {/* Pill Schedule Table */}
      <View style={styles.section}>
        <Text style={styles.label}>Pill Schedule (Mon-Fri):</Text>
        <PillTable />
      </View>

      {/* ESP32 Simulation Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Simulate ESP32 Input (enter pill time):</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="e.g., 13:00"
            placeholderTextColor="#aaa"
            value={espInput}
            onChangeText={setEspInput}
          />
          <View style={styles.addButton}>
            <Button
              title="Send"
              onPress={() => {
                processESP32Input(espInput)
                setEspInput('')
              }}
              color="#fff"
            />
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
    padding: 10,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 10,
  },
  section: {
    marginVertical: 10,
  },
  label: {
    color: '#fff',
    marginBottom: 5,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#555',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButton: {
    marginLeft: 10,
    backgroundColor: '#555',
    borderRadius: 5,
    overflow: 'hidden',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#555',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableHeaderRow: {
    backgroundColor: '#444',
  },
  tableCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#555',
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableHeader: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  tableCellText: {
    color: '#fff',
  },
  pillEmoji: {
    fontSize: 24,
  },
  // On = green; Off = grey.
  onEmoji: {
    color: '#0f0',
  },
  offEmoji: {
    color: 'grey',
  },
  // Ensure the TouchableOpacity has a consistent size.
  touchable: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
