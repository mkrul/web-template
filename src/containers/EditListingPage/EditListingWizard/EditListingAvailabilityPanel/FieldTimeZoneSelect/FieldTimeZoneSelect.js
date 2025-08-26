import React from 'react';
import { getTimeZoneNames } from '../../../../../util/dates';
import { FieldSelect } from '../../../../../components';

/**
 * Field to allow selecting an IANA time zone name.
 *
 * Note: label is optional, but if it is given, an id is also required so
 * the label can reference the input in the `for` attribute
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className
 * @param {string?} props.rootClassName
 * @param {string?} props.id
 * @param {string?} props.label
 * @param {string} props.name
 * @returns {JSX.Element} containing FieldSelect
 */
const FieldTimeZoneSelect = (props) => {
  // Only show US timezones (excluding Canada and other non-US American cities)
  const usTimeZones = [
    'America/New_York',
    'America/Detroit',
    'America/Indiana/Indianapolis',
    'America/Indiana/Knox',
    'America/Indiana/Marengo',
    'America/Indiana/Petersburg',
    'America/Indiana/Vevay',
    'America/Indiana/Vincennes',
    'America/Indiana/Winamac',
    'America/Kentucky/Louisville',
    'America/Kentucky/Monticello',
    'America/Menominee',
    'America/Chicago',
    'America/Indiana/Tell_City',
    'America/North_Dakota/Beulah',
    'America/North_Dakota/Center',
    'America/North_Dakota/New_Salem',
    'America/Denver',
    'America/Boise',
    'America/Phoenix',
    'America/Shiprock',
    'America/Los_Angeles',
    'America/Anchorage',
    'America/Juneau',
    'America/Nome',
    'America/Sitka',
    'America/Yakutat',
    'America/Honolulu',
    'America/Adak',
    'America/Atka',
    'Pacific/Honolulu',
    'Pacific/Midway',
    'Pacific/Wake',
    'America/Puerto_Rico',
    'America/St_Thomas',
    'Pacific/Guam',
    'Pacific/Saipan',
    'Pacific/Pago_Pago',
    'Pacific/Kwajalein',
    'Pacific/Majuro',
  ];

  return (
    <FieldSelect {...props}>
      <option disabled value="">
        Pick something...
      </option>
      {usTimeZones.map((tz) => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </FieldSelect>
  );
};

export default FieldTimeZoneSelect;
