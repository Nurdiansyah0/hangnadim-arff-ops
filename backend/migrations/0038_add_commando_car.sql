-- Add missing Commando Car
INSERT INTO vehicles (code, name, status, vehicle_type) 
VALUES ('COMMANDO CAR', 'Commando Car', 'READY', 'COMMAND_VEHICLE') 
ON CONFLICT (code) DO NOTHING;
