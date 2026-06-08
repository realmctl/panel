<?php

namespace Realm\Http\Controllers\Base;

use Illuminate\View\View;
use Illuminate\View\Factory as ViewFactory;
use Realm\Http\Controllers\Controller;
use Realm\Contracts\Repository\ServerRepositoryInterface;

class IndexController extends Controller
{
    /**
     * IndexController constructor.
     */
    public function __construct(
        protected ServerRepositoryInterface $repository,
        protected ViewFactory $view,
    ) {
    }

    /**
     * Returns listing of user's servers.
     */
    public function index(): View
    {
        return view('templates.spa', ['withModalPortal' => true]);
    }
}
