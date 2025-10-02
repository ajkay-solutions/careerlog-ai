import React, { useState } from 'react';

const DateNavigation = ({ selectedDate, onDateChange }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get today's date
  const today = new Date();
  const isToday = selectedDate && selectedDate.toDateString() === today.toDateString();

  // Format date for display
  const formatDisplayDate = (date) => {
    if (!date) return 'Select Date';
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Format date for input
  const formatInputDate = (date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  // Parse input date
  const parseInputDate = (dateString) => {
    return new Date(dateString + 'T00:00:00');
  };

  // Navigate to previous day
  const goToPreviousDay = () => {
    if (!selectedDate) return;
    const previousDay = new Date(selectedDate);
    previousDay.setDate(previousDay.getDate() - 1);
    onDateChange(previousDay);
  };

  // Navigate to next day
  const goToNextDay = () => {
    if (!selectedDate) return;
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    onDateChange(nextDay);
  };

  // Go to today
  const goToToday = () => {
    onDateChange(new Date());
  };

  // Handle date input change
  const handleDateInputChange = (e) => {
    const dateString = e.target.value;
    if (dateString) {
      const newDate = parseInputDate(dateString);
      onDateChange(newDate);
    }
    setIsCalendarOpen(false);
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const currentDate = selectedDate || new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // First day of the week (start calendar on Sunday)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // Generate 42 days (6 weeks)
    const days = [];
    const currentDay = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return { days, currentMonth: month, currentYear: year };
  };

  // Handle calendar day click
  const handleCalendarDayClick = (date) => {
    onDateChange(date);
    setIsCalendarOpen(false);
  };

  const { days, currentMonth, currentYear } = generateCalendarDays();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Left: Previous day button */}
        <button
          onClick={goToPreviousDay}
          disabled={!selectedDate}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Previous day"
        >
          ←
        </button>

        {/* Center: Date display and picker */}
        <div className="flex items-center gap-4">
          {/* Date display */}
          <div className="relative">
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-medium hover:bg-blue-100 transition-colors"
            >
              {formatDisplayDate(selectedDate)}
            </button>

            {/* Calendar dropdown */}
            {isCalendarOpen && (
              <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-80">
                {/* Month/Year header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {monthNames[currentMonth]} {currentYear}
                  </h3>
                  <button
                    onClick={() => setIsCalendarOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick date input */}
                <div className="mb-4">
                  <input
                    type="date"
                    value={formatInputDate(selectedDate)}
                    onChange={handleDateInputChange}
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                  />
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 text-sm">
                  {/* Day headers */}
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="p-2 text-center text-gray-500 font-medium">
                      {day}
                    </div>
                  ))}
                  
                  {/* Calendar days */}
                  {days.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === currentMonth;
                    const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleCalendarDayClick(day)}
                        className={`p-2 text-center rounded hover:bg-gray-100 transition-colors ${
                          isSelected
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : isToday
                            ? 'bg-blue-50 text-blue-900 font-medium'
                            : isCurrentMonth
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Today button */}
          {!isToday && selectedDate && (
            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-gray-100 border border-gray-300 rounded text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Right: Next day button */}
        <button
          onClick={goToNextDay}
          disabled={!selectedDate}
          className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Next day"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default DateNavigation;