import React, { useState, useEffect } from "react";
import Nav from "/components/Nav";
import styles from "/styles/Login.module.css";
import { signIn } from "next-auth/react";
import Head from 'next/head';

export default function Login() {
  const [formType, setFormType] = useState("login");
  const [error, setError] = useState("");
  const [schools, setSchools] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    school: "",
    grade: "",
    role: "student",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradess, setGradess] = useState([]);
  useEffect(() => {
    fetchSchools();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData({ ...formData, [name]: value });

    if (name === "school") {
      const selectedSchool = schools.find((school) => school.name === value);
      if (selectedSchool) {
        setFilteredGrades(selectedSchool.grades);
        console.log(selectedSchool, selectedSchool.grades)
      } else {
        setFilteredGrades([]);
      }
    }
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError("Email and Password are required");
      return false;
    }
    if (formType === "signup" && (!formData.school || !formData.grade)) {
      setError("School and Grade are required for sign up");
      return false;
    }
    if (
      formType === "signup" &&
      !schools.find((school) => school.name === formData.school)
    ) {
      setError("School not found");
      return false;
    }
    return true;
  };

  const submitSignUp = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/addUser", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await signIn("credentials", {
          redirect: false,
          email: formData.email,
          password: formData.password,
        });
        if (result.ok) {
          window.location.href = "/overview";
        } else {
          setError(result.error || "Failed to sign in. Please try again.");
        }
      } else if (response.status === 409) {
        setError("A user with that email already exists");
      } else {
        setError("Failed to sign up. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during sign up.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result.ok) {
        window.location.href = "/overview";
      } else {
        setError(result.error || "Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during login.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/fetchSchool", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("HTTP error! Status: " + response.status);
      }

      const data = await response.json();
      if (data) {
        const processedSchools = data.map(school => {
          let grades = [];
          if (Array.isArray(school.grades)) {
            grades = school.grades;
            setGradess(grades)
          } else if (typeof school.grades === 'string') {
            grades = school.grades.split(",").map(grade => grade.trim());
            setGradess(grades);
          }

          return {
            ...school,
            grades,
          };
        });
        setSchools(processedSchools);
      }
    } catch (error) {
      console.error("Error fetching schools:", error);
      setError("Error fetching schools");
    }
  };



  return (
    <>
    <Head>
      <title>{'Schooltool | login'}</title>
    </Head>
      <Nav page="login" />
      <form
        className={styles.LoginForm}
        onSubmit={formType === "login" ? submitLogin : submitSignUp}
      >
        <h2>{formType === "login" ? "Log in" : "Sign up"}</h2>
        <div>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter password"
            value={formData.password}
            onChange={handleInputChange}
            required
          />
          {formType === "signup" && formData.email && formData.password && (
            <>
              <label htmlFor="school">School</label>
              <input
                type="text"
                id="school"
                name="school"
                placeholder="Enter school"
                list="schools"
                value={formData.school}
                onChange={handleInputChange}
                required
              />
              {formData.school && (
                <>
                  <label htmlFor="grade">Grade</label>
                  <input
                    type="text"
                    id="grade"
                    name="grade"
                    placeholder="Enter grade"
                    list="grades"
                    value={formData.grade}
                    onChange={handleInputChange}
                    required
                  />
                </>
              )}
              <datalist id="schools">
                {schools.map((school, index) => (
                  <option value={school.name} key={index} />
                ))}
              </datalist>
              <datalist id="grades">
                {gradess.map((name, index) => (
                  <option value={name} key={index} />
                ))}
              </datalist>
            </>
          )}
        </div>
        <button type="submit" disabled={isSubmitting}>
          {formType === "login" ? "Log In" : "Sign Up"}
        </button>
        {formType === "login" && <a href="/forgotpassword">Forgot password?</a>}
        <a
          href={`#${formType}`}
          onClick={() => setFormType(formType === "login" ? "signup" : "login")}
        >
          {formType === "login"
            ? "Don't have an account?"
            : "Already have an account?"}
        </a>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </>
  );
}
