export async function getWeather(city) {
  try {
    const response = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
    if (!response.ok) throw new Error('Weather API error');
    const data = await response.json();
    const current = data.current_condition?.[0];
    if (!current) throw new Error('No weather data');
    return {
      city,
      temperature: current.temp_C,
      feelsLike: current.FeelsLikeC,
      description: current.weatherDesc?.[0]?.value || 'Unknown',
      humidity: current.humidity,
      windSpeed: current.windspeedKmph,
      windDir: current.winddir16Point,
    };
  } catch (err) {
    return { city, error: err.message };
  }
}
