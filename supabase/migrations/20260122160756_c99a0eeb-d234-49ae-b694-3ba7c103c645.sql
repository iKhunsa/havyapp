-- Drop the restrictive policies and recreate as permissive
-- body_weight_logs
DROP POLICY IF EXISTS "Users can create their own weight logs" ON public.body_weight_logs;
DROP POLICY IF EXISTS "Users can delete their own weight logs" ON public.body_weight_logs;
DROP POLICY IF EXISTS "Users can update their own weight logs" ON public.body_weight_logs;
DROP POLICY IF EXISTS "Users can view their own weight logs" ON public.body_weight_logs;

CREATE POLICY "Users can create their own weight logs"
ON public.body_weight_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs"
ON public.body_weight_logs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs"
ON public.body_weight_logs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own weight logs"
ON public.body_weight_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- macro_profiles
DROP POLICY IF EXISTS "Users can create their own macro profile" ON public.macro_profiles;
DROP POLICY IF EXISTS "Users can delete their own macro profile" ON public.macro_profiles;
DROP POLICY IF EXISTS "Users can update their own macro profile" ON public.macro_profiles;
DROP POLICY IF EXISTS "Users can view their own macro profile" ON public.macro_profiles;

CREATE POLICY "Users can create their own macro profile"
ON public.macro_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own macro profile"
ON public.macro_profiles FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own macro profile"
ON public.macro_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own macro profile"
ON public.macro_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- meal_plans
DROP POLICY IF EXISTS "Users can create their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can delete their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can view their own meal plans" ON public.meal_plans;

CREATE POLICY "Users can create their own meal plans"
ON public.meal_plans FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
ON public.meal_plans FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
ON public.meal_plans FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own meal plans"
ON public.meal_plans FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- weekly_plans
DROP POLICY IF EXISTS "Users can create their own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can delete their own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can update their own weekly plans" ON public.weekly_plans;
DROP POLICY IF EXISTS "Users can view their own weekly plans" ON public.weekly_plans;

CREATE POLICY "Users can create their own weekly plans"
ON public.weekly_plans FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly plans"
ON public.weekly_plans FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly plans"
ON public.weekly_plans FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own weekly plans"
ON public.weekly_plans FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- workout_logs
DROP POLICY IF EXISTS "Users can create their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can delete their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can update their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can view their own workout logs" ON public.workout_logs;

CREATE POLICY "Users can create their own workout logs"
ON public.workout_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs"
ON public.workout_logs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
ON public.workout_logs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own workout logs"
ON public.workout_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);