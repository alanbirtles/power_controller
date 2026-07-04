from homeassistant.components.sensor import SensorEntity, SensorDeviceClass
from homeassistant.components.switch import SwitchEntity
from homeassistant.core import HomeAssistant
from .const import DOMAIN, CONF_MULTIPLIER


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities):
    """Set up switches based on events."""

    # Multiplier can come from config entry options or legacy config entry data.
    multiplier = entry.options.get(
        CONF_MULTIPLIER,
        entry.data.get(CONF_MULTIPLIER, 1.0),
    )

    async def device_connected(event):
        mac = event.data["mac"]
        if mac not in hass.data[DOMAIN]["devices"]:
            hass.data[DOMAIN]["devices"][mac] = True
            async_add_entities([PowerWSCurrentSensor(hass, mac, multiplier)])

    hass.bus.async_listen(f"{DOMAIN}_device_connected", device_connected)


# class PowerWSSwitch(SwitchEntity):
#     def __init__(self, hass: HomeAssistant, mac: str):
#         self.hass = hass
#         self._mac = mac
#         self._attr_name = f"Power Switch {mac}"
#         self._attr_unique_id = f"{mac}_switch"
#         self._is_on = False
#
#     @property
#     def is_on(self):
#         return self._is_on
#
#     async def async_turn_on(self, **kwargs):
#         await self._send_command(True)
#
#     async def async_turn_off(self, **kwargs):
#         await self._send_command(False)
#
#     async def _send_command(self, state):
#         ws = self.hass.data[DOMAIN]["connections"].get(self._mac)
#         if ws:
#             await ws.send_json({"power": state})
#             self._is_on = state
#             self.async_write_ha_state()


class PowerWSCurrentSensor(SensorEntity):
    def __init__(self, hass: HomeAssistant, mac: str, multiplier: float):
        self._mac = mac
        self._multiplier = multiplier
        self._attr_name = f"Current {mac}"
        self._attr_unique_id = f"{mac}_current"
        self._attr_device_class = SensorDeviceClass.CURRENT
        self._attr_native_unit_of_measurement = "mA"
        self._state = 0
        self._is_on = False

    async def async_added_to_hass(self):
        self.hass.bus.async_listen(f"{DOMAIN}_data_{self._mac}", self._update_data)

    async def _update_data(self, event):
        raw_current = event.data.get("current", 0)
        self._state = int(float(raw_current) * self._multiplier)
        self.async_write_ha_state()

    @property
    def native_value(self):
        return self._state

    @property
    def is_on(self):
        return self._is_on

    async def async_turn_on(self, **kwargs):
        await self._send_command(True)

    async def async_turn_off(self, **kwargs):
        await self._send_command(False)

    async def _send_command(self, state):
        ws = self.hass.data[DOMAIN]["connections"].get(self._mac)
        if ws:
            await ws.send_json({"power": state})
            self._is_on = state
            self.async_write_ha_state()
