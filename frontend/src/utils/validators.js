/**
 * Vehicle form validation
 */
export function validateVehicle(data) {
  const errors = {}

  if (!data.registration_number?.trim())
    errors.registration_number = 'Registration number is required'

  if (!data.name?.trim())
    errors.name = 'Vehicle name / model is required'

  if (!data.type)
    errors.type = 'Vehicle type is required'

  if (!data.max_load_capacity || Number(data.max_load_capacity) <= 0)
    errors.max_load_capacity = 'Max load capacity must be a positive number'

  if (data.odometer === '' || data.odometer == null || Number(data.odometer) < 0)
    errors.odometer = 'Odometer must be 0 or greater'

  if (!data.acquisition_cost || Number(data.acquisition_cost) <= 0)
    errors.acquisition_cost = 'Acquisition cost must be a positive number'

  return errors
}

/**
 * Driver form validation
 */
export function validateDriver(data) {
  const errors = {}

  if (!data.name?.trim())
    errors.name = 'Name is required'

  if (!data.license_number?.trim())
    errors.license_number = 'License number is required'

  if (!data.license_category)
    errors.license_category = 'License category is required'

  if (!data.license_expiry_date)
    errors.license_expiry_date = 'License expiry date is required'

  if (!data.contact_number?.trim())
    errors.contact_number = 'Contact number is required'
  else if (!/^\d{7,15}$/.test(data.contact_number.replace(/\s/g, '')))
    errors.contact_number = 'Enter a valid contact number (7–15 digits)'

  if (data.safety_score === '' || data.safety_score == null)
    errors.safety_score = 'Safety score is required'
  else if (Number(data.safety_score) < 0 || Number(data.safety_score) > 100)
    errors.safety_score = 'Safety score must be between 0 and 100'

  return errors
}
