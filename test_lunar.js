import { Solar, Lunar } from 'lunar-javascript';

const testDates = [
    { name: 'Christmas Eve', date: '2023-12-24' },
    { name: 'Christmas', date: '2023-12-25' },
    { name: 'Valentine', date: '2024-02-14' },
    { name: 'Spring Festival', date: '2024-02-10' }, // Lunar 2024-01-01
    { name: 'Qingming', date: '2024-04-04' }, // Solar Term
];

testDates.forEach(item => {
    const d = new Date(item.date);
    const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const lunar = solar.getLunar();

    console.log(`--- ${item.name} (${item.date}) ---`);
    console.log('Solar Festivals:', solar.getFestivals());
    console.log('Solar Other Festivals:', solar.getOtherFestivals());
    console.log('Lunar Festivals:', lunar.getFestivals());
    console.log('Lunar Other Festivals:', lunar.getOtherFestivals());
    console.log('JieQi:', lunar.getJieQi());
});
