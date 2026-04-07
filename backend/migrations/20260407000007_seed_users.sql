DO $$ 
DECLARE 
    r RECORD; 
    v_username TEXT; 
    v_base_username TEXT; 
    v_email TEXT; 
    v_first TEXT; 
    v_second TEXT; 
    v_count INT; 
BEGIN 
    -- Get default password hash (admin123)
    
    FOR r IN SELECT id, full_name FROM personnels WHERE id NOT IN (SELECT personnel_id FROM users WHERE personnel_id IS NOT NULL) 
    LOOP 
        -- 1. Clean name: Remove titles (split by comma first)
        v_first := LOWER(SPLIT_PART(REPLACE(REPLACE(r.full_name, ',', ' '), '.', ' '), ' ', 1));
        
        -- 2. Skip initials/MUH
        IF (v_first IN ('m', 'b', 'muh')) THEN
             v_first := LOWER(SPLIT_PART(REPLACE(REPLACE(r.full_name, ',', ' '), '.', ' '), ' ', 2));
        END IF;
        
        v_base_username := v_first;
        v_username := v_base_username;
        
        -- 3. Collision Check
        SELECT COUNT(*) INTO v_count FROM users WHERE username = v_username;
        IF (v_count > 0) THEN
             -- Use second part of name
             v_second := LOWER(SPLIT_PART(REPLACE(REPLACE(r.full_name, ',', ' '), '.', ' '), ' ', 3));
             IF (v_second = '' OR v_second IS NULL OR v_second = v_first OR v_second IN ('m', 'b', 'muh')) THEN
                 v_second := LOWER(SPLIT_PART(REPLACE(REPLACE(r.full_name, ',', ' '), '.', ' '), ' ', 4));
             END IF;
             
             IF (v_second != '' AND v_second IS NOT NULL) THEN
                 v_username := v_first || v_second;
             ELSE
                 v_username := v_first || '1';
             END IF;
        END IF;
        
        v_email := v_username || '@arff.hangnadim.id';
        
        INSERT INTO users (id, username, email, password_hash, personnel_id) 
        VALUES (uuid_generate_v4(), v_username, v_email, '$2b$12$f6gY9rjtJiyLxzby/uVAZOT1ZggsGktM42rQ1K3EpaeS14ACA./pe', r.id)
        ON CONFLICT (username) DO NOTHING;
    END LOOP; 
END $$;
