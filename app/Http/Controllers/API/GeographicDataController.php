<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\SalesRepresentative;

class GeographicDataController extends Controller
{
    /**
     * Get all countries
     */
    public function countries(Request $request)
    {
        $query = DB::table('countries')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $countries = $query->select('id', 'name', 'code', 'code_3', 'phone_code', 'currency_code', 'currency_symbol')
            ->get();

        return response()->json($countries);
    }

    /**
     * Get cities by country
     */
    public function cities(Request $request, $countryId = null)
    {
        $query = DB::table('cities')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($countryId) {
            $query->where('country_id', $countryId);
        } elseif ($request->has('country_id')) {
            $query->where('country_id', $request->get('country_id'));
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $cities = $query->select('id', 'country_id', 'name', 'code', 'region')
            ->get();

        return response()->json($cities);
    }

    /**
     * Get districts by city
     */
    public function districts(Request $request, $cityId = null)
    {
        $query = DB::table('districts')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($cityId) {
            $query->where('city_id', $cityId);
        } elseif ($request->has('city_id')) {
            $query->where('city_id', $request->get('city_id'));
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $districts = $query->select('id', 'city_id', 'name', 'postal_code', 'type')
            ->get();

        return response()->json($districts);
    }

    /**
     * Get tax offices by city
     */
    public function taxOffices(Request $request, $cityId = null)
    {
        $query = DB::table('tax_offices')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($cityId) {
            $query->where('city_id', $cityId);
        } elseif ($request->has('city_id')) {
            $query->where('city_id', $request->get('city_id'));
        }

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $taxOffices = $query->select('id', 'city_id', 'name', 'code', 'type', 'address', 'phone')
            ->get();

        return response()->json($taxOffices);
    }

    /**
     * Get payment terms
     */
    public function paymentTerms(Request $request)
    {
        $query = DB::table('payment_terms')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        $paymentTerms = $query->select('id', 'name', 'code', 'days', 'type', 'discount_percentage', 'discount_days', 'description')
            ->get();

        return response()->json($paymentTerms);
    }

    /**
     * Get payment methods
     */
    public function paymentMethods(Request $request)
    {
        $query = DB::table('payment_methods')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->get('type'));
        }

        $paymentMethods = $query->select('id', 'name', 'code', 'type', 'description', 'requires_bank_account')
            ->get();

        return response()->json($paymentMethods);
    }

    /**
     * Get all geographic data for a specific country (used for bulk loading)
     */
    public function countryData(Request $request, $countryId)
    {
        $country = DB::table('countries')
            ->where('id', $countryId)
            ->where('is_active', true)
            ->first();

        if (!$country) {
            return response()->json(['error' => 'Country not found'], 404);
        }

        $cities = DB::table('cities')
            ->where('country_id', $countryId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->select('id', 'name', 'code', 'region')
            ->get();

        $cityIds = $cities->pluck('id')->toArray();

        $districts = [];
        $taxOffices = [];

        if (!empty($cityIds)) {
            $districts = DB::table('districts')
                ->whereIn('city_id', $cityIds)
                ->where('is_active', true)
                ->orderBy('city_id')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->select('id', 'city_id', 'name', 'postal_code', 'type')
                ->get()
                ->groupBy('city_id');

            $taxOffices = DB::table('tax_offices')
                ->whereIn('city_id', $cityIds)
                ->where('is_active', true)
                ->orderBy('city_id')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->select('id', 'city_id', 'name', 'code', 'type')
                ->get()
                ->groupBy('city_id');
        }

        return response()->json([
            'country' => $country,
            'cities' => $cities,
            'districts' => $districts,
            'tax_offices' => $taxOffices
        ]);
    }

    /**
     * Search locations (cities, districts) for autocomplete
     */
    public function searchLocations(Request $request)
    {
        $search = $request->get('q', '');
        $countryId = $request->get('country_id');
        $limit = min($request->get('limit', 10), 50);

        if (strlen($search) < 2) {
            return response()->json([]);
        }

        $results = [];

        // Search cities
        $citiesQuery = DB::table('cities')
            ->where('is_active', true)
            ->where('name', 'like', "%{$search}%");

        if ($countryId) {
            $citiesQuery->where('country_id', $countryId);
        }

        $cities = $citiesQuery->select('id', 'name', 'country_id', 'region')
            ->limit($limit)
            ->get();

        foreach ($cities as $city) {
            $results[] = [
                'id' => $city->id,
                'name' => $city->name,
                'type' => 'city',
                'country_id' => $city->country_id,
                'region' => $city->region,
                'display' => $city->name . ($city->region ? ' (' . $city->region . ')' : '')
            ];
        }

        // Search districts if not at limit
        if (count($results) < $limit) {
            $remainingLimit = $limit - count($results);
            
            $districtsQuery = DB::table('districts')
                ->join('cities', 'districts.city_id', '=', 'cities.id')
                ->where('districts.is_active', true)
                ->where('districts.name', 'like', "%{$search}%");

            if ($countryId) {
                $districtsQuery->where('cities.country_id', $countryId);
            }

            $districts = $districtsQuery->select(
                    'districts.id',
                    'districts.name',
                    'districts.city_id',
                    'cities.name as city_name',
                    'cities.country_id'
                )
                ->limit($remainingLimit)
                ->get();

            foreach ($districts as $district) {
                $results[] = [
                    'id' => $district->id,
                    'name' => $district->name,
                    'type' => 'district',
                    'city_id' => $district->city_id,
                    'city_name' => $district->city_name,
                    'country_id' => $district->country_id,
                    'display' => $district->name . ' / ' . $district->city_name
                ];
            }
        }

        return response()->json($results);
    }

    /**
     * Get sales representatives
     */
    public function salesRepresentatives(Request $request)
    {
        $query = SalesRepresentative::query()
            ->where('is_active', true)
            ->orderBy('first_name')
            ->orderBy('last_name');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('employee_id', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('department')) {
            $query->where('department', $request->get('department'));
        }

        $salesRepresentatives = $query->select(
                'id', 
                'first_name', 
                'last_name', 
                'full_name', 
                'title', 
                'department', 
                'employee_id',
                'email',
                'phone'
            )
            ->get()
            ->map(function($rep) {
                return [
                    'id' => $rep->id,
                    'name' => $rep->full_name,
                    'display_name' => $rep->display_name,
                    'title' => $rep->title,
                    'department' => $rep->department,
                    'employee_id' => $rep->employee_id,
                    'email' => $rep->email,
                    'phone' => $rep->phone
                ];
            });

        return response()->json($salesRepresentatives);
    }
}