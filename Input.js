import React, { useState, useEffect } from 'react';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const graph = { secs: 'mins', mins: 'hours', hours: 'day', day: 'month', month: 'year' };
const ranges = { 
  year: { min: 0, max: 9999 },
  month: { min: 0, max: 11 }, 
  hours: { min: 0, max: 23 }, 
  mins: {min: 0, max: 59 }, 
  secs: { min: 0, max: 59 },
};

const Input = () => {
  const [value, setValue] = useState('');
  const [parsed, setParsed] = useState(false);
  const [activePart, setActivePart] = useState();
  const [date, setDate] = useState();

  function handleChange(e) {
    setValue(e.target.value);
    setParsed(false);
    setActivePart();
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') return parseInput();

    if (parsed && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const part = findActivePart(e.target.selectionStart);
      setActivePart(part);
      changeDate(part, e);
    }
  }

  function parseInput() {
    if (parsed) return;
    const match = value.match(/^(?<day>\d{1,2})[ /.-]+(?<month>[a-z]{3,}|\d{1,2})([ /.-]+(?<year>\d{1,4})(?!:))?([ /.-]+(?<hours>\d{1,2}))?([ /.:-]+(?<mins>\d{1,2}))?([ /.:-]+(?<secs>\d{1,2}))?\s*$/i);
    if (!match) return;
    const dateObj = formatInput(match.groups);
    if (dateObj) {
      setDate(dateObj);
      setParsed(true);
    }
  }

  function findActivePart(caretPosition) {
    let partEnd = -1;
    for (let part of ['day', 'month', 'year', 'hours', 'mins', 'secs']) {
      if (part === 'month') {
        let index = date[part];
        partEnd += months[index].length + 1;
      } else {
        partEnd += date[part].length + 1;
      }
      if (partEnd >= caretPosition) return part;
    };
  }

  function changeDate(part, e) {
    if (!part) return;
    let next;
    let range = (part === 'day') ? { min: 1, max: days[date.month] } : ranges[part];
    setDate(prevDate => {
      if (e.key === 'ArrowUp') {
        if (+prevDate[part] === range.max) {
          next = range.min;
          if (e.ctrlKey) changeDate(graph[part], e);
        } 
        else {
          next = +prevDate[part] + 1;
        }
      } 
      else if (e.key === 'ArrowDown') {
        if (+prevDate[part] === range.min) {
          next = (e.ctrlKey && part === 'day')
            ? (days[prevDate.month - 1] || days[11])
            : range.max;
          if (e.ctrlKey) changeDate(graph[part], e);
        }
        else {
          next = +prevDate[part] - 1;
        }
      }
      if (part !== 'month') {
        next = next.toString();
        if (part !== 'year') next = next.padStart(2, '0');
      }
      return { ...prevDate, [part]: next };
    });   
  }

  useEffect(() => {
    if (parsed && activePart) {
      if (date.day > days[date.month]) {
        setDate(prevDate => {
          return { ...prevDate, day: days[date.month].toString() }
        });
      }
      const input = document.querySelector('input[name=custom-input]');
      let start;
      let end = -1;
      let length;
      for (let part of ['day', 'month', 'year', 'hours', 'mins', 'secs']) {
        start = end + 1;
        length = part !== 'month' ? date[part].length : months[date.month].length;
        end = start + length;
        if (part === activePart) {
          input.setSelectionRange(start, end);
          return;
        }
      };
    }
  }, [parsed, activePart, date]);

  return (
    <input 
      type='text'
      name='custom-input'
      value={parsed 
        ? `${date.day}/${months[date.month]}/${date.year} ${date.hours}:${date.mins}:${date.secs}` 
        : value} 
      onChange={handleChange}
      onBlur={parseInput}
      onKeyDown={handleKeyDown}
      style={{display: 'block', width: '300px', margin: '5rem auto', padding: '0.2rem' }}
    />
  );
}

// Функция проверяет соответствие введенных данных формату даты и возвращает объект с данными даты в нужном формате
function formatInput(groups) {
  let { day, month, year, hours, mins, secs } = groups;

  let parsedDay = day.padStart(2, '0');
  if (parsedDay == 0 || parsedDay > 31) return;

  let parsedMonth;
  if (isNaN(month)) {
    let re = new RegExp(`^${month}`, 'i');
    parsedMonth = months.findIndex(elem => re.test(elem));
    if (parsedMonth === -1) return;
  } else {
    if (month == 0 || month > 12) return;
    parsedMonth = month - 1;
  }
  // Если введенная дата больше количества дней в месяце, переходим в след. месяц
  if (parsedDay > days[parsedMonth]) {
    parsedDay = (parsedDay - days[parsedMonth]).toString().padStart(2, '0');
    parsedMonth = parsedMonth !== 11 ? parsedMonth + 1 : 0;
  }

  let parsedYear;
  if (!year) parsedYear = new Date().getFullYear();
  else parsedYear = (year.length < 3) ? (+year + 2000) : +year;
  parsedYear = parsedYear.toString();

  let parsedHours;
  if (!hours) parsedHours = '00';
  else if (hours < 24) parsedHours = hours.padStart(2, '0');
  else return;

  let parsedMins;
  if (!mins) parsedMins = '00';
  else if (mins < 60) parsedMins = mins.padStart(2, '0');
  else return;

  let parsedSecs;
  if (!secs) parsedSecs = '00';
  else if (secs < 60) parsedSecs = secs.padStart(2, '0');
  else return;

  return {
    day: parsedDay,
    month: parsedMonth,
    year: parsedYear,
    hours: parsedHours,
    mins: parsedMins,
    secs: parsedSecs,
  };
}

export default Input;
