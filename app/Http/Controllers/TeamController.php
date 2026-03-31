<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Register;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeamController extends Controller
{
    /**
     * Display the team members listing
     */
    public function index()
    {
        // This will render our React Team component
        return Inertia::render('Pages/Team/Team');
    }

    /**
     * Get team members data with pagination and search
     * Endpoint: GET /api/get-team-data
     */
    public function getTeamData(Request $request)
    {
        $search = $request->input('search', '');
        $perPage = $request->input('perPage', 10);
        $filter = $request->input('filter', 'all');

        $query = Register::select(
            'hrmd_register.id',
            'hrmd_register.register_name as first_name',
            'hrmd_register.register_surname as last_name',
            'hrmd_register.register_full_name as name',
            'hrmd_register.email',
            'hrmd_register.register_code as employee_code',
            'hrmd_employee.id as employee_id',
            'users.avatar',
            'users.id as user_id'
        )
            ->leftJoin('hrmd_employee', 'hrmd_register.id', '=', 'hrmd_employee.register_id')
            ->leftJoin('users', 'hrmd_register.id', '=', 'users.register_id');

        // Apply search
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('hrmd_register.register_name', 'like', "%{$search}%")
                    ->orWhere('hrmd_register.register_surname', 'like', "%{$search}%")
                    ->orWhere('hrmd_register.register_full_name', 'like', "%{$search}%")
                    ->orWhere('hrmd_register.email', 'like', "%{$search}%")
                    ->orWhere('hrmd_register.register_code', 'like', "%{$search}%");
            });
        }

        // Apply filter
        if ($filter === 'active') {
            $query->whereNull('hrmd_employee.quit_date');
        } elseif ($filter === 'inactive') {
            $query->whereNotNull('hrmd_employee.quit_date');
        }

        // Get the employees
        $teamMembers = $query->paginate($perPage);

        // Enhance team data with additional information
        $teamMembers->getCollection()->transform(function ($member) {
            // Get employee details
            $employee = Employee::where('register_id', $member->id)->first();

            // Calculate project count and task count (this is placeholder - implement your actual logic)
            $projectCount = rand(5, 30); // Replace with actual project count
            $taskCount = rand(10, 50);   // Replace with actual task count

            // Department and designation
            $designation = $employee ? $this->getDesignation($employee) : 'Staff';

            return [
                'id' => $member->id,
                'name' => $member->name,
                'first_name' => $member->first_name,
                'last_name' => $member->last_name,
                'email' => $member->email,
                'employee_code' => $member->employee_code,
                'designation' => $designation,
                'projectCount' => $projectCount,
                'taskCount' => $taskCount,
                'userImage' => $member->avatar ? asset('storage/' . $member->avatar) : null,
                'backgroundImg' => asset('images/small/img-9.jpg'), // Default background
                'phoneNumber' => $this->getPhoneNumber($member->id),
                'location' => $this->getLocation($member->id),
                'isActive' => $employee ? is_null($employee->quit_date) : true,
                'joinDate' => $employee ? $employee->emp_date : null,
                'skills' => $this->getSkills($member->id),
            ];
        });

        return response()->json($teamMembers);
    }

    /**
     * Store a new team member
     * Endpoint: POST /api/team
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:hrmd_register,email',
            'designation' => 'required|string|max:255',
            'phoneNumber' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:255',
            'isActive' => 'boolean',
        ]);

        // Parse name into first and last
        $nameParts = explode(' ', $validated['name']);
        $lastName = array_pop($nameParts);
        $firstName = implode(' ', $nameParts);

        // Create register entry
        $register = new Register();
        $register->register_name = $firstName;
        $register->register_surname = $lastName;
        $register->register_full_name = $validated['name'];
        $register->email = $validated['email'];
        $register->register_code = $this->generateEmployeeCode();
        $register->save();

        // Create employee entry
        $employee = new Employee();
        $employee->register_id = $register->id;
        $employee->emp_date = now();
        // Set quit_date based on isActive
        if (isset($validated['isActive']) && $validated['isActive'] === false) {
            $employee->quit_date = now();
        }
        $employee->save();

        return response()->json([
            'success' => true,
            'message' => 'Team member added successfully',
            'member' => [
                'id' => $register->id,
                'name' => $register->register_full_name,
                'email' => $register->email,
                'designation' => $validated['designation'],
                'projectCount' => 0,
                'taskCount' => 0,
                'userImage' => null,
                'backgroundImg' => asset('images/small/img-9.jpg'),
                'phoneNumber' => $validated['phoneNumber'] ?? null,
                'location' => $validated['location'] ?? null,
                'isActive' => !isset($employee->quit_date),
                'joinDate' => $employee->emp_date,
                'skills' => [],
            ]
        ]);
    }

    /**
     * Update team member
     * Endpoint: PUT /api/team/{id}
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:hrmd_register,email,'.$id,
            'designation' => 'required|string|max:255',
            'phoneNumber' => 'nullable|string|max:20',
            'location' => 'nullable|string|max:255',
            'isActive' => 'boolean',
        ]);

        // Parse name into first and last
        $nameParts = explode(' ', $validated['name']);
        $lastName = array_pop($nameParts);
        $firstName = implode(' ', $nameParts);

        // Update register
        $register = Register::findOrFail($id);
        $register->register_name = $firstName;
        $register->register_surname = $lastName;
        $register->register_full_name = $validated['name'];
        $register->email = $validated['email'];
        $register->save();

        // Update or create employee
        $employee = Employee::where('register_id', $id)->first();
        if (!$employee) {
            $employee = new Employee();
            $employee->register_id = $id;
            $employee->emp_date = now();
        }

        // Set quit date based on active status
        if (isset($validated['isActive'])) {
            $employee->quit_date = $validated['isActive'] ? null : now();
        }

        $employee->save();

        return response()->json([
            'success' => true,
            'message' => 'Team member updated successfully'
        ]);
    }

    /**
     * Delete team member
     * Endpoint: DELETE /api/team/{id}
     */
    public function destroy($id)
    {
        $register = Register::findOrFail($id);

        // Set the employee as inactive rather than deleting
        $employee = Employee::where('register_id', $id)->first();
        if ($employee) {
            $employee->quit_date = now();
            $employee->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Team member removed successfully'
        ]);
    }

    /**
     * Helper functions for employee data
     */
    private function getDesignation($employee)
    {
        // This is a placeholder - implement your actual designation logic
        // You might have a departments or positions table
        $positionTypes = [
            'Software Developer', 'UI/UX Designer', 'Project Manager',
            'QA Engineer', 'DevOps Engineer', 'System Administrator',
            'Sales Representative', 'Marketing Specialist', 'HR Manager'
        ];

        return $positionTypes[rand(0, count($positionTypes) - 1)];
    }

    private function getPhoneNumber($registerId)
    {
        // This is a placeholder - implement your actual phone number retrieval
        return '+90 (555) ' . rand(100, 999) . ' ' . rand(1000, 9999);
    }

    private function getLocation($registerId)
    {
        // This is a placeholder - implement your actual location retrieval
        $locations = ['Istanbul', 'Ankara', 'Izmir', 'Antalya', 'Bursa'];
        return $locations[rand(0, count($locations) - 1)] . ', Turkey';
    }

    private function getSkills($registerId)
    {
        // This is a placeholder - implement your actual skills retrieval
        $allSkills = [
            'JavaScript', 'PHP', 'React', 'Laravel', 'TypeScript', 'MySQL',
            'Docker', 'Kubernetes', 'AWS', 'Git', 'Bootstrap', 'Tailwind CSS',
            'Project Management', 'Agile', 'Scrum', 'Marketing', 'SEO'
        ];

        $skillCount = rand(2, 5);
        $skills = [];

        for ($i = 0; $i < $skillCount; $i++) {
            $skills[] = $allSkills[rand(0, count($allSkills) - 1)];
        }

        return array_unique($skills);
    }

    private function generateEmployeeCode()
    {
        // Generate a unique employee code with format EMP-XXXX
        $lastEmployee = Register::orderBy('id', 'desc')->first();
        $lastId = $lastEmployee ? $lastEmployee->id + 1 : 1;
        return 'EMP-' . str_pad($lastId, 4, '0', STR_PAD_LEFT);
    }
}
