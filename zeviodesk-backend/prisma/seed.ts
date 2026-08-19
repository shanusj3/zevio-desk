import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const DEVICES = [
  {
    "name": "Apple Iphone 11",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 11 Pro",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 11 Pro Max",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 12",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 12 Mini",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 12 Pro",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 12 Pro Max",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 13",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 13 Mini",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 13 Pro",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 13 Pro Max",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 14",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 14 Plus",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 14 Pro",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 14 Pro Max",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 15",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 15 Plus",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 15 Pro",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 15 Pro Max",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 16",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 16 Plus",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 16 Pro",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 16 Pro Max",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 16E",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 17",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 17 Air",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 17 Pro",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 17 Pro Max",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 17E",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 6",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 6 (Logo Cut)",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 6 Plus",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 6S",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 6S (Logo Cut)",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 6S Plus",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 7",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 7 (Logo Cut)",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 7 Plus",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 7 Plus (Logo Cut)",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 8",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone 8 Plus",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone Se (2020)",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone X",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone X (Logo Cut)",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone Xr",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone Xs",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone Xs Max",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Apple Iphone Xs Max (Logo Cut)",
    "manufacturer": "Apple",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Ai Nova 2 Ultra (5G)",
    "manufacturer": "Ai+",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Ai+ Nova (5G)",
    "manufacturer": "Ai+",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Ai+ Nova 2 (5G)",
    "manufacturer": "Ai+",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Ai+ Nova 2 Neo (5G)",
    "manufacturer": "Ai+",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Ai+ Nova 2 Pro (5G)",
    "manufacturer": "Ai+",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Ai+ Pulse",
    "manufacturer": "Ai+",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Ai+ Pulse 2 (4G)",
    "manufacturer": "Ai+",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Asus Rog 3",
    "manufacturer": "Asus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Asus Zenfone 5Z",
    "manufacturer": "Asus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Asus Zenfone 6Z",
    "manufacturer": "Asus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Asus Zenfone Max Pro M1 Zb601Kl",
    "manufacturer": "Asus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Asus Zenfone Max Pro M2",
    "manufacturer": "Asus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 10",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 10 Pro",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 10 Pro Xl",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 10A",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 4 Xl",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 4A",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 6",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 6 Pro",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 6A",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 7",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 7 Pro",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 7A",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 8",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 8 Pro",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 8A",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 9",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 9 Pro",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 9 Pro Xl",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Google Pixel 9A",
    "manufacturer": "Google",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "HMD Crest (5G)",
    "manufacturer": "HMD",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "HMD Crest Max (5G)",
    "manufacturer": "HMD",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "HMD Vibe (5G)",
    "manufacturer": "HMD",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 10",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 10 Lite",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 20",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 200 (5G)",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 200 Pro (5G)",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 20I",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 6X",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 7A",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 7S",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 7X",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 8 Pro",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 8X",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 9 Lite",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 90 (5G)",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 9I",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 9S",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor 9X Pro",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor Nova 3I",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor P30 Lite",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor View 20",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor X9b (5G)",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor Y9 (2019)",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Honor Y9 Prime",
    "manufacturer": "Huawei/Honor",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Gt 10 Pro (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Gt 20 Pro (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Gt 30 (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Gt 30 Pro (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 10",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 10 Play",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 10S",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 11 (2021)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 11 (2022)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 11S",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 12 Play",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 30 (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 30I",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 40I",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 50 (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 60 (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 60i (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 8",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 9",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Hot 9 Pro",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 10",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 10 Pro",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 11",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 11S",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 12",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 12 Pro (4G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 12 Pro (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 30 (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 40 (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 40 Pro (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 40 Pro Plus (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 40X (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 50S (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 50X (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 60 Pro (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 7",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note 7 Lite",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Note Edge (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix S4",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix S5",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix S5 Lite",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix S5 Pro",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 10",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 10 HD",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 3 Plus",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 4",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 4 Plus",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 5",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 5 Lite",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 5 Pro",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 6",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 8 Hd",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 8 Plus",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart 9 Hd",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Smart Hd (2021)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Zero (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Zero (5G) (2023)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Zero 30 (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Zero 40 (5G)",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Infinix Zero 8I",
    "manufacturer": "Infinix",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 11 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 12 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 13 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 15 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 15R (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 3",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 7 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 7 Legend (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 8",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 9 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 9 Pro",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo 9 Se (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Neo 10 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Neo 10R (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Neo 3",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Neo 6 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Neo 7 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Neo 7 Pro (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Neo 9 Pro (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z1",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z10 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z10 Lite (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z10R (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z10X (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z11X (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z3 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z5 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z6 (44W)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z6 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z6 Lite",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z6 Pro",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z7 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z7 Pro (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z9 (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z9 Lite (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z9S (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z9S Pro (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Iqoo Z9X (5G)",
    "manufacturer": "iQOO",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A100 Pro",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A100C",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A23",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A23 Pro",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A25",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A26",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A27",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A47",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A48",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A49",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A50C",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A60",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A60S",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A70",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A80",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A90",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel A95 (5G)",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel City 100",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel Color Pro (5G)",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel P40",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel P55 (5G)",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel P55 Plus",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel P55T",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel S23",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel S23 Plus",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel Vision 1",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel Vision 1 Pro",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel Vision 2S",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel Vision 3",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Itel Vision 3 Turbo",
    "manufacturer": "Itel",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Agni (5g)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Agni 2 (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Agni 3 (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Agni 4 (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Blaze 2",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Blaze 2 (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Blaze Amoled 2 (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Blaze Curve (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Blaze Dragon (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Blaze Duo (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Blaze Duo 3 (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Blaze X (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Bold (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Bold N2",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Play Ultra (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Shark",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Shark (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Shark 2",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Storm (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Storm Lite (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Storm Play (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Virat V1 (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Yuva (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Yuva 2 (5G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Yuva 2 Pro",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Yuva 3",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Yuva 3 Pro",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Yuva 4",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Yuva Smart",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Yuva Star",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Yuva Star 2 (4G)",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lava Yuva Star 3",
    "manufacturer": "Lava",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lenovo A7",
    "manufacturer": "Lenovo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lenovo K10 Plus",
    "manufacturer": "Lenovo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lenovo K5 Note",
    "manufacturer": "Lenovo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lenovo K6 Note",
    "manufacturer": "Lenovo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lenovo K6 Power",
    "manufacturer": "Lenovo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lenovo K8 Plus",
    "manufacturer": "Lenovo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Lenovo K9",
    "manufacturer": "Lenovo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Micromax In 1B",
    "manufacturer": "Micromax",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Micromax In Note 1",
    "manufacturer": "Micromax",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Edge 20 Fusion",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Edge 20 Pro",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Edge 30 Pro",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola G8 Power Lite",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto E13",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto E32S",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto E40",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto E7 Power",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 20",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 30",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 30 Fusion",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 30 Ultra",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 40",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 40 Neo",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 5",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 50 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 50 Fusion (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 50 Neo (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 50 Pro (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 50 Ultra (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 60 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 60 Fusion (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 60 Pro (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 60 Stylus",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 70 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 70 Fusion (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 70 Max (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Edge 70 Pro (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G04",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G04S",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G05",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G06 Power",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G10",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G10 Power",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G13",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G14",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G17",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G22",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G24 Power",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G30",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G31",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G32",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G34 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G35 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G37 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G37 Power (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G40 Fusion",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G42",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G45 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G5 Plus",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G51 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G52",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G54 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G57 Power (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G5S Plus",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G60",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G62 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G64 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G67 Power (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G71 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G72",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G73 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G82 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G84 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G85 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G86 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G86 Power (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G9",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G9 Plus",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G9 Power",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto G96 (5G)",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola Moto Signature",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Motorola One Fusion Plus",
    "manufacturer": "Motorola",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 2.2",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 2.3",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 3.2",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 4.2",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 5.1",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 5.1 Plus",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 6.1",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 6.1 Plus",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 7",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 7.1",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 7.1 Plus",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 7.2",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia 8.1",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia C01 Plus",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia C12",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia C20 Plus",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia C22",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia C31",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia C32",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia G11 Plus",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia G20",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia G42 (5G)",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nokia G60 (5G)",
    "manufacturer": "Nokia",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing CMF Phone 1",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing CMF Phone 2 Pro (5G)",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 1",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 2",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 2A",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 2A Plus",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 3",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 3A",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 3A Lite",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 3A Pro",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 4A",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 4A Pro",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Nothing Phone 4B",
    "manufacturer": "Nothing",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 10 Pro (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 10R (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 10T (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 11 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 11R (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 12 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 12R (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 13 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 13R (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 13S (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 13T (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 15 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 15R (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 15T (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 3",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 3T",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 5",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 5T",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 6",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 6T",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 7",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 7 Pro",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 7T",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 7T Pro",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 8",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 8 Pro",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 8T (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 9 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 9 Pro (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 9R (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus 9RT (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus N6 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord 2 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord 2T (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord 3 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord 4 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord 5 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord 6 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord CE",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord CE 2 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord CE 2 Lite (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord CE 3 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord CE 3 Lite (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord CE 4 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord CE 4 Lite (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord CE 5 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord Ce 6 (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oneplus Nord CE 6 Lite (5G)",
    "manufacturer": "Oneplus",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A11K",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A12",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A15",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A15S",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A16",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A16E",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A16K",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A17",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A17K",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A18",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A1K",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A3 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A3 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A31",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A33 (2020)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A37",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A38",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A3S",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A3X (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A5 (2020)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A5 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A5 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A52",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A53",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A53S (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A54",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A55",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A57 (2016)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A57 (4G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A57 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A58",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A59 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A5S",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A5X (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A6 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A6 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A6C (4G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A6C (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A6X (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A7",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A71",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A71K",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A72",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A73",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A74 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A75",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A75S",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A76",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A77",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A77S",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A78 (4G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A78 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A79 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A83",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A9",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A9 (2020)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A91",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A92",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A92S",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo A96",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Ace 2",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F11",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F11 Pro",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F15",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F17",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F17 Pro",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F19",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F19 Pro",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F19 Pro Plus",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F19S",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F21 Pro (4G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F21 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F21S Pro (4G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F21S Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F23 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F25 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F27 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F27 Pro Plus (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F29 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F29 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F3",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F3 Plus",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F31 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F31 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F31 Pro Plus (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F33 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F33 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F5",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F7",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F7 Youth",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F9",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo F9 Pro",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Find X2 Pro",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Find X7",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Find X8",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Find X8 Pro",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Find X9",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Find X9 Pro",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Find X9 Ultra",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo K1",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo K10 (4G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo K10 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo K12X (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo K13 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo K13 Turbo (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo K13 Turbo Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo K13X (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo K14 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo K3",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo R15X",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 10 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 10 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 10 Pro Plus (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 11 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 11 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 12 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 12 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 13 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 13 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 14 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 14 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 15 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 15 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 15 Pro Mini (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 15c (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 16 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 16C (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 2",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 2F",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 2Z",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 3 Pro",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 4",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 4 Pro",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 5",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 5 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 6 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 6 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 7 (4G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 7 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 7 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 8 (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 8 Pro (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Oppo Reno 8T (5G)",
    "manufacturer": "Oppo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco C3",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco C31",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco C50",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco C55",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco C61",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco C65",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco C71 (4G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco C75 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco C85 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco C85X (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco F1",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco F2 Pro",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco F3 Gt (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco F4 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco F5 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco F6 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco F7 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M2",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M2 Pro",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M2 Reloaded",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M3",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M3 Pro (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M4 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M4 Pro (4G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M4 Pro (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M5",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M6 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M6 Plus (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M6 Pro (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M7 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M7 Plus (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco M7 Pro (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X2",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X3",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X3 Pro",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X4 Pro (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X5 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X5 Pro (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X6 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X6 Neo (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X6 Pro (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X7 (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X7 Pro (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X8 Pro (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Poco X8 Pro Max (5G)",
    "manufacturer": "Poco",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 1",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 10 (4G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 10 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 10 Pro Plus (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 11 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 11 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 11 Pro Plus (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 11X (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 12 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 12 Plus (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 12 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 12 Pro Plus (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 12X (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 13 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 13 Plus (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 13 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 13 Pro Plus (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 14 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 14 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 14 Pro Lite (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 14 Pro Plus (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 14T (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 14X (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 15 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 15 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 15T (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 15X (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 16 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 16 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 16 Pro Plus (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 16T (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 2",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 2 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 3",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 3 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 3I",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 5",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 5 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 5I",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 5S",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 6",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 6 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 6I",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 6S",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 7",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 7 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 7I",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 8 (4G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 8 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 8 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 8I",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 8S (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 9 (4G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 9 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 9 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 9 Pro Plus (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 9 Se (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 9I (4G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme 9I (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C1",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C11 (2020)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C11 (2021)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C12",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C15",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C17",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C2",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C20",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C21",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C21Y",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C25",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C25S",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C25Y",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C3",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C30",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C30S",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C31",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C33",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C33 (2023)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C35",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C51",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C53",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C55",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C61",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C63 (4G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C63 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C65 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C67 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C71 (4G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C71 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C73 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C75 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C83 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme C85 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt 2",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt 2 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt 6",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt 6T (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt 7 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt 7 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt 7T (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt Master Edition",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt Neo 2",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt Neo 3",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Gt Neo 3T",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 10",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 10A",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 20",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 20 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 20A",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 30 (4G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 30 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 30 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 30A",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 50 (4G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 50 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 50 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 50A",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 50A Prime",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 50I",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 50I Prime",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 60 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 60 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 60X (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 70 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 70 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 70 Turbo (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 70X (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 80 Lite (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 80 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 80X (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 90 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo 90X (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo N53",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo N55",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo N63",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Narzo N65 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P1 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P1 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P1 Speed (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P2 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P3 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P3 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P3 Ultra (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P3X (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P4 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P4 Lite",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P4 Power (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P4 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P4R (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme P4X (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme U1",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme X",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme X2",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme X2 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme X3",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme X3 Superzoom",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme X50 Pro",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme X7 (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme X7 Max (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme X7 Pro (5G)",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Realme Xt",
    "manufacturer": "Realme",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 12 Air",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 15",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 15 Air",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 15 Pro",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 16",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 16 Premier",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 16 Pro",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 17",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 17 Pro",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 18",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 19",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 19 Pro (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 20",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 20 Pro (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon 30 (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon I4",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon Iace 2",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon Iace 2X",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Camon Isky 3",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Phantom 9",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Phantom X",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pop 5 Lite",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pop 6 Pro",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pop 7 Pro",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pop 9 (4G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pop 9 (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova 2",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova 3",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova 5 Pro (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova 6 Neo (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova 6 Pro (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova 7 (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova 7 Pro (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova 8 (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova Curve (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova Curve 2 (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova Neo",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Pova Slim (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 10 (4G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 10 (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 10C",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 20",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 20 Pro (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 4",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 4 Air",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 5",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 5 Pro",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 50 (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 6 Air",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 6 Go",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 7",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 7 Pro",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 7T",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 8",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 8C",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark 9",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "TECNO SPARK GO (2019)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Go (2020)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Go (2021)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Go (2022)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Go (2023)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Go (2024)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Go (5G)",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Go 1",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Go 2",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Go 3",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Go Plus",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Tecno Spark Power 2",
    "manufacturer": "Tecno",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo S1",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo S1 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T1 (44W)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T1 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T1 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T1X",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T2 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T2 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T2X (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T3 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T3 Lite (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T3 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T3 Ultra (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T3X (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T4 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T4 Lite (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T4 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T4 Ultra (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T4R (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T4X (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T5 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T5E (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo T5X (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo U10",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo U20",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V11",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V11 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V15",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V15 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V17",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V17 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V19",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V20",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V20 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V20 Se",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V21 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V21E (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V23 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V23 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V23E (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V25 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V25 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V27 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V27 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V29 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V29 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V29E (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V30 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V30 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V30E (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V40 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V40 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V40E (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V5",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V5 Lite",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V5 Plus",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V50 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V50E (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V5S",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V60 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V60 Lite (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V60E (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V7",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V7 Plus",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V70 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V70 Elite (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V70 FE (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V9",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V9 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo V9 Youth",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X100 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X100 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X200 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X200 FE (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X200 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X200T (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X300 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X300 FE (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X300 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X50",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X50 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X60",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X60 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X60 Pro Plus",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X70 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X70 Pro Plus",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X80",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X80 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X90",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo X90 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y01",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y01A",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y02",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y02T",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y05",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y100 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y100A (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y11",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y11 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y12",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y12G",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y12S",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y15",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y15C",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y15S",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y16",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y17",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y17S",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y18",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y18 (4G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y18E",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y18T",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y19",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y19 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y19E",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y19S",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y19S (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y1S",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y20",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y200 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y200 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y200E (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y20A",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y20G",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y20I",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y20T",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y21",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y21 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y21A",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y21E",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y21G",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y21T",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y22",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y27",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y28 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y28E (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y28S (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y29 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y30",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y300 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y300 Plus (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y31 (4G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y31 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y31 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y33S",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y33T",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y35",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y36",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y38 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y39 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y400 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y400 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y50",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y51",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y51 Pro (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y51A",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y52S",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y53",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y53S",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y56 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y58 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y65",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y66",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y67",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y69",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y71",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y71I",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y72 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y73",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y75 (4G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y75 (5G)",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y81",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y81I",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y83",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y83 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y85",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y89",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y90",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y91",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y91I",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y93",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y95",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Y97",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Z1 Pro",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Vivo Z1X",
    "manufacturer": "Vivo",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 10",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 10I (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 10T (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 10T Pro (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 11 Lite",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 11 Lite Ne (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 11 Ultra",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 11I (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 11I Hypercharge (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 11T Pro (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 11X (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 11X Pro (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 12 Pro (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 13 Pro (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 14 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 14 Civi (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 15 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 15 Ultra",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 17 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 17 Ultra",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi 17T (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi A1",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi A2",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi A3",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi Max",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Mi Max 2",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 10",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 10 Power",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 10 Prime (2022)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 10A",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 11 Prime (4G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 11 Prime (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 12 (4G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 12 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 12C",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 13 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 13C (4G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 13C (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 14C (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 15 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 15A (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 15C (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 3S",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 3S Prime",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 4A",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 5",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 5A",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 6",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 6 Pro",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 6A",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 7",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 7A",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 8",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 8A",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 8A Dual",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 9",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 9 Activ",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 9 Power",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 9 Prime",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 9A",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 9A Sport",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 9I",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi 9I Sport",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi A1 (2022)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi A1 Plus",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi A2",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi A2 Plus",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi A3 (2024)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi A3X",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi A4 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi A5",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi A7 Pro",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Go",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi K20",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi K20 Pro",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi K50I (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 10",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 10 Lite",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 10 Pro",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 10 Pro Max",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 10S",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 10T (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 11",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 11 Pro (4G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 11 Pro (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 11 Pro Plus (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 11 Se",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 11S",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 11T (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 12 (4G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 12 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 12 Pro (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 12 Pro Plus (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 13 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 13 Pro (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 13 Pro Plus (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 14 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 14 Pro (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 14 Pro Plus (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 14 SE (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 15 (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 15 Pro (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 15 Pro Plus (5G)",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 4",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 5",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 5 Pro",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 6 Pro",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 7",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 7 Pro",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 7S",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 8",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 8 Pro",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 9",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 9 Pro",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Note 9 Pro Max",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Turbo 5",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Y1",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Y2",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Redmi Y3",
    "manufacturer": "Xiaomi",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Zte Blade V8 Mini",
    "manufacturer": "ZTE",
    "category": "Smartphone",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Ultrabook Core i7 6500U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Apple Ultrabook Core i5",
    "manufacturer": "Apple",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i5 8250U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i5 7200U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook A6-Series 9220",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Core i7 8550U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i7 8550U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Core i3 7100U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Gaming Core i7 7700HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i7 8550U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Notebook Core i5 6200U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i3 6006U 2",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook A9-Series 9420 3",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i5 7200U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "MSI Gaming Core i7 7700HQ",
    "manufacturer": "MSI",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Core i5 8250U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i3 6006U 2",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Netbook Celeron Quad Core N3450",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i5 8250U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Gaming Core i5 7300HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook A6-Series 9220",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Ultrabook Core i5 7Y54",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook A9-Series 9420 3",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook Core i7 8550U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i5 7200U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Core i5 8250U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Gaming Core i7 7700HQ",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i7 8550U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Vero Notebook Celeron Dual Core N3350",
    "manufacturer": "Vero",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Gaming Ryzen 1700 3",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Ultrabook Core i5 7200U",
    "manufacturer": "Xiaomi",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Core i7 7500U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus 2 in 1 Convertible Core i7 8550U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Celeron Dual Core N3060 0",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Ultrabook Core i7 8550U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Celeron Dual Core N3350",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Core i7 7700HQ",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook Core M 6Y75",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Core i3 6006U 2",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Gaming Core i7 7700HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i3 6006U 2",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i7 8550U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Gaming FX 9830P 3",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Core i7 8550U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i5 7200U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Gaming Core i5 7300HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i3 7130U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Ultrabook Core i7 7500U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer 2 in 1 Convertible Core i5 8250U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Apple Ultrabook Core i7",
    "manufacturer": "Apple",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i7 6600U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i7 7500U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Ultrabook Core i7 7500U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Celeron Dual Core N3350",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i3 6006U 2",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i3 7100U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Notebook Core i7 6500U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook Core i5 7500U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i3 7100U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Workstation Core i5 6440HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Workstation Core i7 6820HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i3 7100U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i7 7500U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Ultrabook Core i5 8250U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i7 7500U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus 2 in 1 Convertible Core i5 8250U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Apple Ultrabook Core M m3",
    "manufacturer": "Apple",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Pentium Quad Core N4200",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i5 8250U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i5 8250U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Notebook Core i3 6006U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Pentium Quad Core N4200",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook E-Series E2-9000e",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i7 7500U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i5 8250U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Ultrabook Core i7 7700HQ",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook A9-Series 9420 3",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i5 7440HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Celeron Dual Core N3060",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook Core i7 7500U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Razer Gaming Core i7 7820HK",
    "manufacturer": "Razer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i3 6006U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Core i5 7200U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Microsoft Ultrabook Core i5 7200U",
    "manufacturer": "Microsoft",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i7 8550U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Gaming Core i7 7700HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook A9-Series 9420 3",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Core i3 7130U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Workstation Xeon E3-1505M V6 3",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "MSI Gaming Core i5 7300HQ",
    "manufacturer": "MSI",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Huawei Ultrabook Core i5 7200U",
    "manufacturer": "Huawei",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook A6-Series A6-9220",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook E-Series 9000e",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i5 6200U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Microsoft Ultrabook Core i7 7660U",
    "manufacturer": "Microsoft",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Notebook Core i3 7100U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i7 7700HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i3 7100U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i7 7700HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus 2 in 1 Convertible Celeron Dual Core N3350",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i7 8550U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i7 7820HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i7 7500U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook E-Series 6110",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i7 7560U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i5 7200U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i7 8650U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Workstation Core i7 7820HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer 2 in 1 Convertible Core i5 6200U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Chuwi Notebook Atom x5-Z8300 4",
    "manufacturer": "Chuwi",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Workstation Core i7 7820HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "MSI Gaming Core i7 6920HQ",
    "manufacturer": "MSI",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Pentium Quad Core N3710",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Ultrabook Core i7 6600U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook E-Series E2-6110",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP 2 in 1 Convertible Core i7 8550U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Ultrabook Core i5 7200U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook A10-Series A10-9620P",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook A10-Series 9600P",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Gaming Core i7 7820HK",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Google Ultrabook Core i5 7Y57",
    "manufacturer": "Google",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Microsoft Ultrabook Core M m3-7Y30",
    "manufacturer": "Microsoft",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Workstation Core i7 7700HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Workstation Core i7 7700HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Celeron Dual Core 3205U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i7 6700HQ",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i3 6100U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Gaming Core i5 7300HQ",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Ultrabook Core i7 8550U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Celeron Dual Core N3350",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Netbook Celeron Dual Core N3060",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Notebook Core i5 7200U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i5 7300U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP 2 in 1 Convertible Core i5 8250U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Huawei Ultrabook Core i7 7500U",
    "manufacturer": "Huawei",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus 2 in 1 Convertible Core i5 7200U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook A10-Series A10-9620P",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Netbook Celeron Dual Core N3350",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer 2 in 1 Convertible Celeron Dual Core N3350",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook Core i7 6500U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Celeron Dual Core 3855U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i5 8250U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Ultrabook Core i7 8550U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i7 7700HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i5 7300HQ",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Notebook Core i5 8250U",
    "manufacturer": "Xiaomi",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Pentium Quad Core N3710",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Netbook Celeron Dual Core N3060",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Chuwi Notebook Celeron Quad Core N3450",
    "manufacturer": "Chuwi",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Pentium Quad Core N4200",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Workstation Core i5 7440HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i7 7820HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Gaming Core i5 7300HQ",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Pentium Quad Core N3710",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook A9-Series A9-9420 3",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Gaming Core i7 7820HK",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i3 6100U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Chuwi Notebook Atom x5-Z8350 4",
    "manufacturer": "Chuwi",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Mediacom Notebook Atom x5-Z8350 4",
    "manufacturer": "Mediacom",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Ultrabook Core i7 7500U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Gaming Core i7 6820HK",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i3 6006U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i7 7600U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "MSI Gaming Core i7 7820HK",
    "manufacturer": "MSI",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Ultrabook Core i5 7200U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i5 7200U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i5 7300HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP 2 in 1 Convertible Core i7 7600U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus 2 in 1 Convertible Core i7 7500U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Core i5 7200U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Mediacom Notebook Celeron Quad Core N3450",
    "manufacturer": "Mediacom",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook E-Series 7110",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i3 7100U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Mediacom 2 in 1 Convertible Celeron Dual Core N3350",
    "manufacturer": "Mediacom",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i7 7600U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Samsung Netbook Celeron Dual Core N3060",
    "manufacturer": "Samsung",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Netbook Celeron Dual Core N3060",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Celeron Quad Core N3450",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook A8-Series 7410",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "MSI Gaming Core i7 6820HK",
    "manufacturer": "MSI",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Notebook Core i7 8550U",
    "manufacturer": "Xiaomi",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Celeron Dual Core N3060",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Ultrabook Core i5 7200U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i5 7300U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Workstation Core i7 7600U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Razer Gaming Core i7 7700HQ",
    "manufacturer": "Razer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook E-Series E2-9000",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Fujitsu Notebook Core i5 7200U",
    "manufacturer": "Fujitsu",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Gaming Core i7 6820HK",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP 2 in 1 Convertible Core i3 7100U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Gaming Ryzen 1600",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Workstation Core i7 7700HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook A10-Series 9620P",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i5 6200U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Ultrabook Core i7 7700HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Celeron Dual Core N3060",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Gaming Core i7 6700HQ",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Xeon E3-1535M v6",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP 2 in 1 Convertible Celeron Dual Core N3350",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Gaming Core i7 6700HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Ultrabook Core i5 6200U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "LG Ultrabook Core i7 8550U",
    "manufacturer": "LG",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook A12-Series 9720P",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer 2 in 1 Convertible Core i7 6500U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook A8-Series 7410",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Celeron Dual Core N3060",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i7 7600U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Gaming Core i7 6700HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Core M 7Y30",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Samsung Ultrabook Core i7 7500U",
    "manufacturer": "Samsung",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Google Ultrabook Core i7 7Y75",
    "manufacturer": "Google",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Samsung Notebook Core i7 7700HQ",
    "manufacturer": "Samsung",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Workstation Xeon E3-1535M v5",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook A12-Series 9720P",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i5 6300U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i5 6300U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP 2 in 1 Convertible Pentium Quad Core N4200",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i5 6300HQ",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP 2 in 1 Convertible Core i5 7200U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i7 6500U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i7 6820HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook A10-Series 9600P",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i5 6260U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer 2 in 1 Convertible Celeron Dual Core N3060",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i5 6200U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i5 7300HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i5 7300HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Notebook Core i5 6300U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Celeron Dual Core 3855U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Pentium Dual Core N4200",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Workstation Core i7 6700HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Ultrabook Core i5 7300U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook A6-Series 7310 2",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Netbook Pentium Quad Core N4200",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Netbook Core i5 7300U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i5 7200U 0",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Ultrabook Core i7 6600U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook A4-Series 7210",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Mediacom Notebook Atom Z8350 2",
    "manufacturer": "Mediacom",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Celeron Quad Core N3710",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i7 7660U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Ultrabook Core i7 6500U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP 2 in 1 Convertible Core i7 7500U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Ultrabook Core i5 6200U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Gaming Core i7 6820HK",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook A12-Series 9700P",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Netbook Celeron Dual Core N3050",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Gaming Core i7 7700HQ",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Notebook Core i3 6100U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Core i7 7Y75",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer 2 in 1 Convertible Celeron Quad Core N3160",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Gaming Core i5 6300HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i7 6600U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Pentium Quad Core N3710",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "MSI Gaming Core i7 6700HQ",
    "manufacturer": "MSI",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Notebook Core i7 7500U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Ultrabook Core i5 6200U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Core i5 6200U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Microsoft Ultrabook Core i7 7600U",
    "manufacturer": "Microsoft",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core M m7-6Y75",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Apple Ultrabook Core M",
    "manufacturer": "Apple",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Gaming FX 8800P",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus 2 in 1 Convertible Core M M3-6Y30",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Samsung Ultrabook Core i5 7200U",
    "manufacturer": "Samsung",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Core i3 7100U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "LG Ultrabook Core i7 7500U",
    "manufacturer": "LG",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Netbook Core i7 7500U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Core i7 7500U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i5 6300HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Notebook Pentium Dual Core 4405U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Gaming Core i7 6700HQ",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Workstation Core i7 6500U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Fujitsu Notebook Core i5 6200U",
    "manufacturer": "Fujitsu",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Razer Ultrabook Core i7 7500U",
    "manufacturer": "Razer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Xiaomi Ultrabook Core i5 6200U",
    "manufacturer": "Xiaomi",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook A10-Series 9620P",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Netbook Celeron Dual Core N3060",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Workstation Core i7 6820HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i7 6500U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Vero Notebook Atom X5-Z8350 4",
    "manufacturer": "Vero",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook A9-Series 9420",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus 2 in 1 Convertible Core M M7-6Y75",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Samsung 2 in 1 Convertible Core i7 7500U",
    "manufacturer": "Samsung",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook Core i7 6600U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Netbook Core M 6Y75",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Netbook Celeron Dual Core N3060",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i7 6500U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Core i3 6100U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i7 6600U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Core i5 7Y54",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell 2 in 1 Convertible Core i7 6500U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Pentium Quad Core N3710",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook Core i5 6200U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i5 7300U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook Core i5 7200U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i7 6560U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Toshiba Ultrabook Core i5 7200U",
    "manufacturer": "Toshiba",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i7 7500U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i3 6100U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Netbook Core i5 6200U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Celeron Quad Core N3160",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Ultrabook Core M 6Y30",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i7 6500U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Core i5 6200U",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Celeron Dual Core N3050",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Core i7 6700HQ",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook Celeron Dual Core N3050",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook A9-Series 9410",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i7 6500U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Ultrabook Core M 6Y75",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "MSI Gaming Core i7 6820HQ",
    "manufacturer": "MSI",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Celeron Dual Core N3050",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo 2 in 1 Convertible Atom x5-Z8550 4",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook Core i5 6300U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Workstation Core i7 6500U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP 2 in 1 Convertible Core i5 6300U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Celeron Dual Core N3350 2",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP 2 in 1 Convertible Core i7 6600U",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Pentium Dual Core 4405Y",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i7 6700HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Pentium Quad Core N3700",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Ultrabook Core i7 6500U 0",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i5 6300U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Samsung 2 in 1 Convertible Cortex A72&A53",
    "manufacturer": "Samsung",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core i7 7700HQ",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook E-Series 7110",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Notebook Core i5 6300HQ",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Notebook E-Series 9000",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Ultrabook Core i7 6500U",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Notebook Core i3 6006U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Asus Notebook Core i7 7700HQ",
    "manufacturer": "Asus",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer Netbook Celeron Dual Core 3205U",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Acer 2 in 1 Convertible Core i7 7Y75",
    "manufacturer": "Acer",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook A12-Series 9720P",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i3 6100U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "HP Notebook Core M 6Y54",
    "manufacturer": "HP",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Lenovo Netbook Core i7 6500U 0",
    "manufacturer": "Lenovo",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Dell Ultrabook Core i5 6200U",
    "manufacturer": "Dell",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "MSI Gaming Core i7 7500U",
    "manufacturer": "MSI",
    "category": "Laptop",
    "itemType": "Device"
  },
  {
    "name": "Razer Ultrabook Core i7 6500U",
    "manufacturer": "Razer",
    "category": "Laptop",
    "itemType": "Device"
  }
]

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL;

  if (!email) {
    console.error("❌ SUPER_ADMIN_EMAIL is not set in the environment variables.");
    process.exit(1);
  }

  // 1. Seed Super Admin
  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (!existing) {
    const password = process.env.SUPER_ADMIN_PASSWORD;
    if (!password) {
      console.error("❌ SUPER_ADMIN_PASSWORD is not set in the environment variables.");
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        name: process.env.SUPER_ADMIN_NAME || "Super Admin",
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        tenantId: null,
        status: "ACTIVE",
      },
    });

    console.log("✅ Super admin created successfully");
  } else {
    console.log("✅ Super admin already exists");
  }

  // 2. Seed Global Catalog Items
  console.log("🌱 Seeding Global Catalog Items...");
  let seededCount = 0;
  for (const dev of DEVICES) {
    const normalizedName = dev.name.trim().toLowerCase();
    await prisma.globalCatalogItem.upsert({
      where: { normalizedName },
      update: {
        name: dev.name,
        manufacturer: dev.manufacturer,
        category: dev.category,
        itemType: dev.itemType,
        isActive: true,
      },
      create: {
        name: dev.name,
        normalizedName,
        manufacturer: dev.manufacturer,
        category: dev.category,
        itemType: dev.itemType,
        isActive: true,
      },
    });
    seededCount++;
  }
  console.log(`✅ Seeded ${seededCount} Global Catalog Items successfully.`);
}

main()
  .catch((e) => {
    console.error("❌ Error during database seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
