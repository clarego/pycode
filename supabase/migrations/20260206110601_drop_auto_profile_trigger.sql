/*
  # Drop auto profile trigger

  The handle_new_user trigger was automatically creating profiles on auth user
  creation, but caused conflicts with the edge function that also manages 
  profiles. Profile creation is now handled explicitly by the manage-users 
  edge function.
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
