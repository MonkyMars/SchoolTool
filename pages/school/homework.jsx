import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router'; // Import useRouter for redirection
import { useSession, signIn } from "next-auth/react";
import Nav from "/components/Nav";
import { getWeek } from "../../components/components.jsx";
import styles from "/styles/Homework.module.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  addYears,
  isWeekend,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  formatISO,
} from "date-fns";
import Head from 'next/head';

// Helper function to get day name
const getDayName = (dayNumber) => {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[dayNumber];
};

const Homework = () => {
  const router = useRouter(); // Initialize router for redirection
  const { data: session, status } = useSession(); // Use session for authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Manage authentication state
  const Week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const today = new Date();
  const [currentWeek] = useState(getWeek(today));
  const [currentYear] = useState(today.getFullYear());
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);

  const dayOfWeek = today.getDay();
  const adjustedDayOfWeek = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : dayOfWeek;
  const [currentDay] = useState(adjustedDayOfWeek);

  const [currentHomeWork, setCurrentHomework] = useState([]);
  const [homework, setHomework] = useState({
    title: "",
    description: "",
    deadline: formatISO(today, { representation: "date" }),
    status: 0,
  });

  const [homeworkAddVisible, setHomeworkAddVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // Use object to manage context menu for specific note
  const [contextMenuPosition, setContextMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    if (status === "loading") return; // Waiting for session to load

    if (status === "unauthenticated") {
      signIn(); // Redirect to sign-in if not authenticated
    } else {
      setIsAuthenticated(true); // Set authentication state
      fetchHomework(); // Fetch homework if authenticated
    }
  }, [status]);

  const getWeekRange = () => {
    const minDate = startOfWeek(today, { weekStartsOn: 1 }); // Week starts on Monday
    const maxDate = endOfWeek(addYears(today, 1), { weekStartsOn: 1 }); // End of week one year in future
    return { minDate, maxDate };
  };

  const { minDate, maxDate } = getWeekRange();

  const decrementSelectedWeek = () => {
    setSelectedWeek((prevWeek) => (prevWeek === 1 ? 52 : prevWeek - 1));
  };

  const incrementSelectedWeek = () => {
    setSelectedWeek((prevWeek) => (prevWeek === 52 ? 1 : prevWeek + 1));
  };

  const handleSubmitHomework = async (e) => {
    e.preventDefault();
    await createHomework();
    setHomework({
      ...homework,
      deadline: `${Week[
        currentDay - 1
      ].toLowerCase()}%${selectedWeek}%${currentYear}`,
    });
  };

  const createHomework = async () => {
    if (homework.title && homework.description) {
      console.log(homework.deadline)
      try {
        const response = await fetch("/api/addHomework", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'user': JSON.stringify(session.user), 
          },
          body: JSON.stringify(homework),
        });
        if (!response.ok) {
          console.error("Failed to add homework");
        }
        console.log("Homework added successfully");
        fetchHomework();
        setHomeworkAddVisible(false);
      } catch (error) {
        console.error(error);
      }
    } else {
      window.alert("Please fill in all fields");
    }
  };

  const fetchHomework = async () => {
    try {
      const response = await fetch("/api/fetchHomework", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "user": JSON.stringify(session.user), 
        },
      });
      if (!response.ok) {
        console.error("Failed to fetch homework");
        return;
      }
      const data = await response.json();
      const sortedHomework = data.message.rows.sort((a, b) =>
        a.title.localeCompare(b.title)
      ); 
      setCurrentHomework(sortedHomework);
    } catch (error) {
      console.error("Error fetching homework:", error);
    }
  };

  const updateHomework = async (id, status) => {
    try {
      const response = await fetch("/api/updateHomework", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "user": JSON.stringify(session.user), 
        },
        body: JSON.stringify({ id, status }),
      });
      if (!response.ok) {
        console.error("Failed to update homework");
      }
      fetchHomework(); // Refresh homework list after update
    } catch (error) {
      console.error("Error updating homework:", error);
    }
  };

  const handleDelete = async (id) => {
    const section = 1;
    try {
      const response = await fetch("/api/deleteMixed", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.accessToken}`, // Add authorization header
        },
        body: JSON.stringify({ section, id }),
      });
      setCurrentHomework((prevCurrentHomework) =>
        prevCurrentHomework.filter((homework) => homework.id !== id)
      );
      setContextMenu(null);
      if (response.ok) {
        console.log("Deleted successfully");
      } else {
        const errorData = await response.json();
        console.error("Failed to delete:", errorData.error || "Unknown error");
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    setContextMenuPosition({ top: e.clientY, left: e.clientX });
    setContextMenu(id);
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const isWeekday = (date) => !isWeekend(date);

  const handleDateChange = (date) => {
    if (date) {
      try {
        const dayName = getDayName(date.getDay());
        const weekNumber = getWeek(date); // Ensure this function is correct
        const year = date.getFullYear();
        setHomework({
          ...homework,
          deadline: `${dayName.toLowerCase()}%${weekNumber}%${year}`,
        });
      } catch (error) {
        console.error("Error handling date change:", error);
      }
    }
  };

  const parseDateString = (dateString) => {
    const [dayName, weekNumber, year] = dateString.split("%");
    const weekDayNames = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
    ];
    const dayIndex = weekDayNames.indexOf(dayName.toLowerCase());

    if (dayIndex === -1 || isNaN(weekNumber) || isNaN(year)) {
      return null; // Return null for invalid date strings
    }

    const startOfYear = new Date(year, 0, 1);
    const firstMonday =
      startOfYear.getDay() === 1
        ? startOfYear
        : addDays(startOfYear, 8 - startOfYear.getDay());

    const targetWeekStart = addWeeks(firstMonday, parseInt(weekNumber, 10) - 1);
    return addDays(targetWeekStart, dayIndex);
  };

  const getInitialDate = () => {
    try {
      return homework.deadline ? parseDateString(homework.deadline) : null;
    } catch (error) {
      console.error("Error parsing initial date:", error);
      return null;
    }
  };

  return (
    <>
    <Head>
      <title>{'Schooltool | homework'}</title>
    </Head>
      <Nav />
      <main className={styles.Main}>
        <div className={styles.Slider}>
          <label placeholder></label>
          <label placeholder></label>
          <button onClick={decrementSelectedWeek}>&larr;</button>
          <label>{selectedWeek}</label>
          {selectedWeek !== currentWeek && (
            <label
              className={styles.setCurrent}
              onClick={() => setSelectedWeek(currentWeek)}
            >
              current week
            </label>
          )}
          <button onClick={incrementSelectedWeek}>&rarr;</button>
          <button onClick={() => setHomeworkAddVisible(!homeworkAddVisible)}>
            Add
          </button>
        </div>
        <div className={styles.homework}>
          {Week.map((week, index) => (
            <div key={index} className={styles.homeworkItem}>
              <label>{week} - {currentYear}</label>
              <div>
                {currentHomeWork.map((homework, index) => {
                  const deadLine = homework.deadline;
                  const [homeworkDay, homeworkWeek, homeworkYear] =
                    deadLine.split("%");
                  return (
                    <div
                      key={homework.id || index}
                      onContextMenu={(e) => handleContextMenu(e, homework.id)}
                    >
                      {week.toLowerCase() === homeworkDay &&
                        selectedWeek == homeworkWeek && currentYear == homeworkYear && (
                          <>
                            <div className={styles.Homework}>
                              <span>
                                {homework.title}
                                <input
                                  type="checkbox"
                                  checked={homework.status === 1}
                                  onClick={() =>
                                    updateHomework(
                                      homework.id,
                                      homework.status === 1 ? 0 : 1
                                    )
                                  }
                                  onChange={() =>
                                    updateHomework(
                                      homework.id,
                                      homework.status === 1 ? 0 : 1
                                    )
                                  }
                                />
                              </span>
                            </div>
                          </>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
      {homeworkAddVisible && (
        <div>
          <form onSubmit={handleSubmitHomework} className={styles.AddHomework}>
            <h2>Add Homework</h2>
            <input
              type="text"
              placeholder="Title"
              value={homework.title}
              onChange={(e) =>
                setHomework({ ...homework, title: e.target.value })
              }
            />
            <textarea
              placeholder="Description"
              value={homework.description}
              onChange={(e) =>
                setHomework({ ...homework, description: e.target.value })
              }
            />
            <div className={styles.DatePickerWrapper}>
              <DatePicker
                selected={getInitialDate()}
                onChange={handleDateChange}
                minDate={minDate}
                maxDate={maxDate}
                filterDate={isWeekday}
                dateFormat="yyyy-MM-dd"
              />
            </div>
            <input type="submit" value="Submit" />
          </form>
          <button onClick={() => setHomeworkAddVisible(false)}>Cancel</button>
        </div>
      )}
      {contextMenu !== null && (
        <div
          className={styles.contextMenu}
          style={{
            top: `${contextMenuPosition.top}px`,
            left: `${contextMenuPosition.left}px`,
          }}
        >
          <label onClick={() => handleEdit(contextMenu)}>Edit</label>
          <label onClick={() => handleDelete(contextMenu)}>Delete</label>
          <label onClick={handleContextMenuClose}>Close</label>
        </div>
      )}
    </>
  );
};

export default Homework;
