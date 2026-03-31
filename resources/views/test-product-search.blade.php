<!DOCTYPE html>
<html>
<head>
    <title>Product Search Test</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>
<body>
    <h1>Product Search Test</h1>
    
    <input type="text" id="search" placeholder="Search products..." />
    <button onclick="searchProducts()">Search</button>
    
    <div id="results"></div>
    
    <script>
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });
        
        function searchProducts() {
            const query = $('#search').val();
            const url = '/purchasing/requests/search-products';
            
            console.log('Searching:', query);
            console.log('URL:', url);
            
            $.ajax({
                url: url,
                method: 'GET',
                data: { q: query, limit: 10 },
                success: function(data) {
                    console.log('Success:', data);
                    $('#results').html('<pre>' + JSON.stringify(data, null, 2) + '</pre>');
                },
                error: function(xhr, status, error) {
                    console.error('Error:', xhr.status, error);
                    $('#results').html('Error: ' + xhr.status + ' - ' + error + '<br>' + xhr.responseText);
                }
            });
        }
    </script>
</body>
</html>