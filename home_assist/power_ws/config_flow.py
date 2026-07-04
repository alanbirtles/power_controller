from homeassistant import config_entries
import voluptuous as vol

from homeassistant.core import callback
from .const import DOMAIN, CONF_MULTIPLIER


class PowerWSConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    async def async_step_user(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="WebSocket Power", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Optional(CONF_MULTIPLIER, default=1.0): vol.Coerce(float),
                }
            ),
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return PowerWSOptionsFlow()


class PowerWSOptionsFlow(config_entries.OptionsFlow):
    async def async_step_init(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        current_multiplier = self.config_entry.options.get(
            CONF_MULTIPLIER,
            self.config_entry.data.get(CONF_MULTIPLIER, 1.0),
        )

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        CONF_MULTIPLIER, default=current_multiplier
                    ): vol.Coerce(float),
                }
            ),
        )
