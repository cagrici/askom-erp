<?php

namespace App\Console\Commands;

use App\Models\InvoiceD;
use Illuminate\Console\Command;

class InvoicesDCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'get:invoices-d';

    /**
     * The console command description.
     */
    protected $description = 'Get invoices details.';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $invoices = uyumapi('SELECT invoice_d_id, invoice_m_id, line_no, whouse_id, sales_person_id, amt, amt_vat, amt_tra, cur_rate_tra, cur_tra_id, qty, unit_price, unit_price_tra, vat_id, doc_date, due_date, branch_id, co_id, dcard_id, item_id, note1, source_m_id, source_d_id, unit_id, item_name_manual, due_day, amt_with_disc, amt_with_disc_tra, expense_id, create_date, update_date FROM psmt_invoice_d where invoice_d_id between 600000 and 650000  ');
        foreach ($invoices as $invoice) {

            if ($invoice['update_date'] == '0001-01-01T00:00:00') {
                $invoice['update_date'] = null;
            } else {
                $invoice['update_date'] = date('Y-m-d H:m:s', strtotime($invoice['update_date']));
            }
            $id = $invoice['invoice_d_id']; unset($invoice['invoice_d_id']);
            InvoiceD::updateOrCreate(['id' => $id], $invoice);
        }
    }

}
