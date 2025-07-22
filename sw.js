const CACHE_NAME = 'helm-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/cache-status.html',
  '/toplayer.css',
  '/manifest.json'
];

// Install event - cache essential resources
self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Essential files cached');
        return self.skipWaiting();
      })
      .catch(function(error) {
        console.log('Cache install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker activated');
      return self.clients.claim();
    }).then(function() {
      // Start background caching after activation
      setTimeout(function() {
        cacheChaptersInBackground();
      }, 1000);
    })
  );
});

// Simple fetch handler
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Fetch from network
        return fetch(event.request).then(function(response) {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Cache the response for future use
          var responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(function() {
          // If both cache and network fail, return main page for documents
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Background caching function
function cacheChaptersInBackground() {
  console.log('Starting background caching...');
  
  var chapterDirectories = [
    '1_1_math_notation_n_symbols-web',
    '1_2_indices-web',
    '1_3_simplificatn_n_factorisatn-web',
    '1_4_arthmtic_algebraic_fractns-web',
    '1_5_formulae_n_transposition-web',
    '2_1_basic_concpts_of_functions-web',
    '2_2_graph_of_functn_n_paramtrc_form-web',
    '2_3_one_2_one_n_inverse_functions-web',
    '2_4_characterising_functions-web',
    '2_5_the_straight_line-web',
    '2_6_the_circle-web',
    '2_7_some_common_engineering_functns-web',
    '3_1_solving_linear_equatns-web',
    '3_2_solving_quadratic_equatns-web',
    '3_3_solving_polynomial_equatns-web',
    '3_4_solving_simultneus_linear_equatns-web',
    '3_5_solving_inequalities-web',
    '3_6_partial_fractions-web',
    '4_1_right_angled_triangles-web',
    '4_2_trigonometric_functns-web',
    '4_3_trigonometric_identities-web',
    '4_4_applicatn_trignmetry_to_triangles-web',
    '4_5_applicatn_trignmetry_to_waves-web',
    '5_1_functions_n_modelling-web',
    '5_2_quadratic_functions_n_modelling-web',
    '5_3_oscillating_functions_n_mdelling-web',
    '5_4_casestudy_invrse_squre_law_model-web',
    '6_1_exponential_function-web',
    '6_2_hyperbolic_functions-web',
    '6_3_logarithms-web',
    '6_4_logarithmic_function-web',
    '6_5_modelling_exercises-web',
    '6_6_log_linear_graphs-web',
    '7_1_introduction_to_matrices-web',
    '7_2_matrix_multiplication-web',
    '7_3_determinants-web',
    '7_4_inverse_of_matrix-web',
    '8_1_cramers_rule_4_simul_linear_eqns-web',
    '8_2_solv_simul_linr_eqn_inv_mtrx_mthd-web',
    '8_3_gauss_elimination-web',
    '9_1_basic_concepts_vectors-web',
    '9_2_cartesian_components_of_vector-web',
    '9_3_scalar_product-web',
    '9_4_vector_product-web',
    '9_5_lines_and_planes-web',
    '10_2_argnd_diag_n_polar_form-web',
    '10_3_expo_form_complx_num-web',
    '10_4_demoivre_theorem-web',
    '11_1_intro_diffrntiatn-web',
    '11_2_use_derivative_table-web',
    '11_3_higher_derivatives-web',
    '11_4_diff_prod_n_quotnt-web',
    '11_5_chain_rule-web',
    '11_6_paramtrc_diffrntiatn-web',
    '11_7_implicit_diffrntiatn-web',
    '12_1_tangents_n_normals-web',
    '12_2_maxima_n_minima-web',
    '12_3_newtn_raphsn_mthd-web',
    '12_4_curvature-web',
    '12_5_diffrntiatn_vectors-web',
    '12_6_casestudy_complx_impednce-web',
    '13_1_basics_integration-web',
    '13_2_definite_integrals-web',
    '13_3_area_bounded_by_curve-web',
    '13_4_integrtn_by_parts-web',
    '13_5_integrtn_substitutn_partlfrac-web',
    '13_6_integrtn_trig_functns-web',
    '14_1_integrtn_as_limit_of_sum-web',
    '14_2_meanvalue_n_rms_functn-web',
    '14_3_volum_of_revolutn-web',
    '14_4_lengths_curvs_surfs_revlutn-web',
    '15_1_integrtn_of_vectors-web',
    '15_2_calculate_cntre_of_mass-web',
    '15_3_momnts_of_inertia-web',
    '16_1_sequences_n_series-web',
    '16_2_infinite_series-web',
    '16_3_binomial_series-web',
    '16_4_power_series-web',
    '16_5_maclaurin_n_taylor_series-web',
    '17_1_conic_sections-web',
    '17_2_polar_coordinates-web',
    '17_3_parametric_curves-web',
    '18_1_funcns_severl_variabls-web',
    '18_2_partial_derivatives-web',
    '18_3_stationary_points-web',
    '18_4_errors_n_percntge_chnge-web',
    '19_1_modling_with_diffrntl_eqns-web',
    '19_2_first_order_odes-web',
    '19_3_second_order_odes-web',
    '19_4_applications_diffrntl_eqns-web',
    '20_1_causal_functions-web',
    '20_2_laplce_transfrm_n_inverse-web',
    '20_3_frthr_laplce_trnsforms-web',
    '20_4_solving_diffrntl_equatins-web',
    '20_5_convolution_theorem-web',
    '20_6_transfer_functions-web',
    '21_1_z_trnsms-web',
    '21_2_bscs_z_trnsfm_thry-web',
    '21_3_z_trnsfm_n_difrnce_eqn-web',
    '21_4_eng_app_z_trnsfms-web',
    '21_5_smpld_fns-web',
    '22_1_eignval_eignvec_basics-web',
    '22_2_applctn_eignval_eignvec-web',
    '22_3_repted_eignval_sym_matx-web',
    '22_4_numrcl_detrmntn_eignvl_eignvc-web',
    '23_1_periodic_functions-web',
    '23_2_rprsnt_periodc_funcn_fourr_series-web',
    '23_3_even_n_odd_funcns-web',
    '23_4_convergence-web',
    '23_5_halfrange_series-web',
    '23_6_fourr_complex_form-web',
    '23_7_applicatn_fourier_series-web',
    '24_1_fourier_transform-web',
    '24_2_properties_fourier_trnsform-web',
    '24_3_special_fourier_trnsform_pairs-web',
    '25_1_partial_diffrntl_equatns-web',
    '25_2_applications_of_pdes-web',
    '25_3_solutn_using_sepratn_variabls-web',
    '25_4_solutn_using_fourier_series-web',
    '26_1_cmplx_fns-web',
    '26_2_cr_eqns_n_cnfml_mpng-web',
    '26_3_stnd_cmplx_fns-web',
    '26_4_bsc_cmplx_int-web',
    '26_5_cauchy_thm-web',
    '26_6_snglrts_n_resdus-web',
    '27_1_intro_srfc_ints-web',
    '27_2_mult_ints_non_rctnglr_rgns-web',
    '27_3_vol_ints-web',
    '27_4_chng_coords-web',
    '28_1_bkgrnd_vec_calc-web',
    '28_2_diff_vec_calc-web',
    '28_3_orthog_cvlnr_coords-web',
    '29_1_line_ints_vecs-web',
    '29_2_sfc_n_vol_ints-web',
    '29_3_int_vec_thms-web',
    '30_1_rnd_error_n_cndtng-web',
    '30_2_gauss_elim-web',
    '30_3_lu_decmp-web',
    '30_4_mtrx_norms-web',
    '30_5_itrtv_mthds_systms_eqns-web',
    '31_1_plynml_approx-web',
    '31_2_num_int-web',
    '31_3_num_diff-web',
    '31_4_non_lin_eqns-web',
    '32_1_init_val_probs-web',
    '32_2_lin_mltstp_methds-web',
    '32_3_prdctr_crctr_methds-web',
    '32_4_prblc_pde-web',
    '32_5_hypblc_pde-web',
    '33_1_two_pt_bdry_val_prblm-web',
    '33_2_elliptic_pde-web',
    '34_1_prjctls-web',
    '34_2_forces_mr_thn_one_d-web',
    '34_3_rstd_motn-web',
    '35_1_sets-web',
    '35_2_elmntry_prob-web',
    '35_3_addn_mult_laws_prob-web',
    '35_4_total_prob_bayes_thm-web',
    '36_1_dscrbng_data-web',
    '36_2_explrng_data-web',
    '37_1_dscrt_prob_distn-web',
    '37_2_bnml_dist-web',
    '37_3_poisson_dist-web',
    '37_4_hyprgmytrc_dist-web',
    '38_1_cont_prob_dist-web',
    '38_2_unifm_dist-web',
    '38_3_exp_dist-web',
    '39_1_norm_dist-web',
    '39_2_norm_apprx_bnml_dist-web',
    '39_3_sums_n_diffs_rndm_vars-web',
    '40_1_smplng_dists-web',
    '40_2_intvl_est_var-web',
    '41_1_stat_tstng-web',
    '41_2_tsts_cncng_sngl_smpl-web',
    '41_3_tsts_cnsng_two_smpls-web',
    '42_1_gdns_fit-web',
    '42_2_cntngncy_tbls-web',
    '43_1_rgrssn-web',
    '43_2_correln-web',
    '44_1_one_way_anova-web',
    '44_2_two_way_anova-web',
    '44_3_expmntl_desgn-web',
    '45_1_non_pmtrc_tsts_sngl_smpl-web',
    '45_2_non_pmtrc_tsts_two_smpls-web',
    '46_1_reliability-web',
    '46_2_quality_cntrl-web'
  ];
  
  var totalCached = 0;
  var currentIndex = 0;
  
  function cacheNextChapter() {
    if (currentIndex >= chapterDirectories.length) {
      console.log('Background caching complete! Cached files for ' + chapterDirectories.length + ' chapters.');
      
      // Notify clients
      self.clients.matchAll().then(function(clients) {
        clients.forEach(function(client) {
          client.postMessage({
            type: 'CACHE_COMPLETE',
            cached: totalCached,
            total: totalCached,
            chapters: chapterDirectories.length
          });
        });
      });
      return;
    }
    
    var chapterDir = chapterDirectories[currentIndex];
    cacheChapterFiles(chapterDir).then(function(cached) {
      totalCached += cached;
      console.log('Cached chapter ' + (currentIndex + 1) + '/' + chapterDirectories.length + ': ' + chapterDir + ' (' + cached + ' files)');
      currentIndex++;
      
      // Small delay before next chapter
      setTimeout(cacheNextChapter, 100);
    });
  }
  
  cacheNextChapter();
}

function cacheChapterFiles(chapterDir) {
  return new Promise(function(resolve) {
    var filesToTry = [
      chapterDir + '/' + chapterDir + '.html',
      chapterDir + '/' + chapterDir + 'se1.html',
      chapterDir + '/' + chapterDir + 'se2.html',
      chapterDir + '/' + chapterDir + 'se3.html',
      chapterDir + '/' + chapterDir + 'se4.html',
      chapterDir + '/' + chapterDir + 'se5.html',
      chapterDir + '/' + chapterDir + 'se6.html',
      chapterDir + '/' + chapterDir + 'li1.html',
      chapterDir + '/' + chapterDir + 'li2.html',
      chapterDir + '/' + chapterDir + 'li3.html',
      chapterDir + '/' + chapterDir + '.css',
      chapterDir + '/additional.css',
      chapterDir + '/toplayer.css'
    ];
    
    var cached = 0;
    var completed = 0;
    
    caches.open(CACHE_NAME).then(function(cache) {
      filesToTry.forEach(function(filePath) {
        fetch(filePath)
          .then(function(response) {
            if (response.status === 200) {
              return cache.put(filePath, response).then(function() {
                cached++;
              });
            }
          })
          .catch(function() {
            // File doesn't exist - this is expected
          })
          .finally(function() {
            completed++;
            if (completed === filesToTry.length) {
              resolve(cached);
            }
          });
      });
    });
  });
}
