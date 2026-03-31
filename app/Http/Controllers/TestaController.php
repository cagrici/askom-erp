<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\DB;
use Intervention\Image\Laravel\Facades\Image;

class TestaController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function index(Request $request)
    {

        $test = DB::connection('logo')->table('urunler_resimler')->first();
        dd($test);
        die();

        $get = DB::table('urunler_resimler')->whereNull('ok')->first();
        $product = DB::table('products')->where('special_int_1', $get->idd)->first();
        if ($product) {

            $saveDir = "D:\Laragon\www\askom\storage\app\public\products\\".$product->id;
            if (!is_dir($saveDir)) {
                mkdir($saveDir, 0777, true); // recursive mkdir (alt klasörlerle birlikte)
            }

            $fileName = basename($get->static);
            $savePath = $saveDir . '\\'. $fileName;
            $thumbPath = $saveDir . '\thumb_'.$fileName;
            $imageData = file_get_contents($get->static);

            $image_path = 'products/'.$product->id.'/'.$fileName;
            $thumbnail_path = 'products/'.$product->id.'/thumb_'.$fileName;

            if ($imageData !== false) {
                file_put_contents($savePath, $imageData);
                DB::table('urunler_resimler')->where('idd', $get->idd)->update(['ok' => 1]);
                // Thumbnail üret

                $thumb = Image::read($imageData)
                    ->contain(150, 150, 'ffffff'); // 'transparent' da verebilirsin (png için)
                $thumb->toJpeg(80)->save($thumbPath);

            } else {
                DB::table('urunler_resimler')->where('idd', $get->idd)->update(['ok' => 2]);
            }

            DB::table('product_images')->insert([
                'product_id' => $product->id,
                'image_path' => $image_path,
                'thumbnail_path' => $thumbnail_path,
                'is_primary' => 1,
                'sort_order' => 1,
            ]);

        }


        die();

//        $superAdminRole = Role::find(1);
//        $superAdminRole->givePermissionTo(Permission::all());

        $user = Auth::user();
        dd($user->roles[0]->name);

        $user->assignRole('Super Admin');

    }



}
