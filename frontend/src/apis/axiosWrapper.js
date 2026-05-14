import axios from "axios";
import { API_BASE_URL } from "./config";

const defaultHeader = {
    "Content-Type": "application/json",
    Accept : "application/json",
};

export const axiosWrapper = axios.create({
    baseURL : API_BASE_URL,
    withCredentials: true,
    headers : { ...defaultHeader },
})
