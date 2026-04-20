"use client"

import React, { useState } from 'react'

interface MiniCalendarProps {
    selectedDate: Date
    onDateChange: (date: Date) => void
}

export function MiniCalendar({ selectedDate, onDateChange }: MiniCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
                <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                    &larr;
                </button>
                <h3 className="font-semibold text-gray-800 text-sm">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                    &rarr;
                </button>
            </div>

            {/* Days of the Week */}
            <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-medium text-gray-500">
                <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-sm">
                {/* Empty slots for days before the 1st */}
                {[...Array(firstDayOfMonth)].map((_, i) => (
                    <div key={`empty-${i}`} className="p-2"></div>
                ))}

                {/* Actual days */}
                {[...Array(daysInMonth)].map((_, i) => {
                    const dayNumber = i + 1
                    const dateOfThisButton = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber)
                    const isSelected = isSameDay(dateOfThisButton, selectedDate)
                    const today = new Date()
                    const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    const isToday = isSameDay(dateOfThisButton, todayNormalized)

                    return (
                        <button
                            key={dayNumber}
                            onClick={() => onDateChange(dateOfThisButton)}
                            className={`p-1.5 w-full rounded-md flex items-center justify-center transition-colors ${isSelected
                                    ? 'bg-black text-white font-medium shadow-sm'
                                    : isToday
                                        ? 'bg-gray-100 text-black font-semibold hover:bg-gray-200'
                                        : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {dayNumber}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}